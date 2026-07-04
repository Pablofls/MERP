import { createClient } from "@supabase/supabase-js";
import { decrypt } from "./encrypt";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getGoogleAccessToken(supabaseToken: string): Promise<string | null> {
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
  return token.access_token ?? null;
}

// Verifies the JWT with Supabase before returning the raw token.
// Never relies solely on RLS — explicit check ensures the token is valid and unexpired.
export async function requireAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await supabase.auth.getUser();

  return user ? token : null;
}
