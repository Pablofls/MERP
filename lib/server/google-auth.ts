import { createClient } from "@supabase/supabase-js";
import { decrypt } from "./encrypt";

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

export async function getGoogleAccessToken(supabaseToken: string): Promise<string | null> {
  const userId = userIdFromJwt(supabaseToken);
  const cached = userId ? accessTokenCache.get(userId) : undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });

  const { data } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .maybeSingle();

  if (!data?.refresh_token) return null;

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

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;
  const token = await res.json();
  if (userId && token.access_token) {
    const ttl = Math.max((Number(token.expires_in) || 3600) - 120, 0) * 1000;
    accessTokenCache.set(userId, { token: token.access_token, expiresAt: Date.now() + ttl });
  }
  return token.access_token ?? null;
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
