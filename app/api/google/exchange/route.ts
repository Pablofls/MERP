import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { encrypt } from "@/lib/server/encrypt";

const ALLOWED_REDIRECT_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

const REDIRECT_PATH = "/auth/callback/google";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(`exchange:${ip}`, 5, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Require a valid Supabase session — prevents unauthenticated relay abuse
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  // Verify the JWT directly — getUser() without args uses internal session storage
  // which is always empty in stateless server-side contexts.
  const verifyClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await verifyClient.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Separate client with the user token for RLS-scoped DB writes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { code, redirectUri } = await req.json();

  if (!code || !redirectUri) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Validate redirectUri — must match the known callback path
  const parsed = (() => { try { return new URL(redirectUri); } catch { return null; } })();
  const requestOrigin = req.headers.get("origin") ?? req.headers.get("referer");
  const allowedOrigin = ALLOWED_REDIRECT_ORIGIN ?? (requestOrigin ? new URL(requestOrigin).origin : null);

  if (!parsed || parsed.pathname !== REDIRECT_PATH || (allowedOrigin && parsed.origin !== allowedOrigin)) {
    return NextResponse.json({ error: "Invalid redirect_uri" }, { status: 400 });
  }

  const params = new URLSearchParams({
    code,
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.error_description ?? data.error }, { status: 400 });
  }

  if (!data.refresh_token) {
    return NextResponse.json({ error: "No refresh_token received" }, { status: 400 });
  }

  // Encrypt the refresh token if the key is configured; fall back to plaintext otherwise
  let tokenToStore: string;
  try {
    tokenToStore = encrypt(data.refresh_token);
  } catch {
    tokenToStore = data.refresh_token;
  }

  const { error: dbError } = await supabase
    .from("google_tokens")
    .upsert(
      {
        user_id: user.id,
        refresh_token: tokenToStore,
        scope: data.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (dbError) {
    const detail = process.env.NODE_ENV === "development" ? dbError.message : undefined;
    return NextResponse.json({ error: "Failed to save token", detail }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
