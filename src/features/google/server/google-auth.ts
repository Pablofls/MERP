import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/server/encrypt";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Caché en memoria (por instancia) del access token de Google, por usuario de Supabase.
// Evita releer google_tokens y refrescar contra Google en cada llamada.
const accessTokenCache = new Map<string, { token: string; expiresAt: number }>();

export function invalidateGoogleToken(userId: string) {
  accessTokenCache.delete(userId);
}

// Solo se llama con un JWT ya verificado por requireAuth.
function userIdFromJwt(jwt: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export type ResultadoToken =
  | { token: string }
  // sin_conexion: no hay refresh token o Google lo invalidó (p. ej. caducó a los 7 días en modo Testing)
  // error: fallo transitorio (red, 5xx); la conexión puede seguir siendo válida
  | { token: null; motivo: "sin_conexion" | "error" };

export async function obtenerGoogleAccessToken(
  supabaseToken: string,
  { forzar = false }: { forzar?: boolean } = {},
): Promise<ResultadoToken> {
  const userId = userIdFromJwt(supabaseToken);
  const cached = userId ? accessTokenCache.get(userId) : undefined;
  if (!forzar && cached && cached.expiresAt > Date.now()) return { token: cached.token };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });

  const { data, error } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .maybeSingle();

  if (error) return { token: null, motivo: "error" };
  if (!data?.refresh_token) return { token: null, motivo: "sin_conexion" };

  // Decrypt the stored token; fall back to plaintext for tokens stored before encryption was added
  let refreshToken: string;
  try {
    refreshToken = decrypt(data.refresh_token);
  } catch {
    refreshToken = data.refresh_token;
  }

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  let res: Response;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  } catch {
    return { token: null, motivo: "error" };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err?.error === "invalid_grant") {
      // El refresh token ya no sirve: borrar la fila para que la app muestre "no conectado"
      if (userId) {
        invalidateGoogleToken(userId);
        await supabase.from("google_tokens").delete().eq("user_id", userId);
      }
      return { token: null, motivo: "sin_conexion" };
    }
    return { token: null, motivo: "error" };
  }

  const token = await res.json();
  if (!token.access_token) return { token: null, motivo: "error" };
  if (userId) {
    const ttl = Math.max((Number(token.expires_in) || 3600) - 120, 0) * 1000;
    accessTokenCache.set(userId, { token: token.access_token, expiresAt: Date.now() + ttl });
  }
  return { token: token.access_token };
}

export async function getGoogleAccessToken(supabaseToken: string): Promise<string | null> {
  return (await obtenerGoogleAccessToken(supabaseToken)).token;
}

/**
 * fetch contra una API de Google con el access token del usuario. Si Google responde 401
 * (token revocado), descarta el caché y reintenta una vez con un token recién refrescado.
 * Devuelve null si no hay conexión válida con Google.
 */
export async function googleFetch(
  supabaseToken: string,
  url: string,
  init: RequestInit = {},
): Promise<Response | null> {
  const conToken = (token: string) =>
    fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });

  const primero = await obtenerGoogleAccessToken(supabaseToken);
  if (!primero.token) return null;
  const res = await conToken(primero.token);
  if (res.status !== 401) return res;

  const segundo = await obtenerGoogleAccessToken(supabaseToken, { forzar: true });
  if (!segundo.token) return null;
  return conToken(segundo.token);
}

// Verifies the JWT with Supabase before returning the raw token.
// Never relies solely on RLS — explicit check ensures the token is valid and unexpired.
export async function requireAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  // getClaims(jwt) verifica la firma localmente (JWKS en caché) y la expiración,
  // sin viaje a Supabase Auth en cada llamada.
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getClaims(token);

  return !error && data?.claims?.sub ? token : null;
}
