import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_REDIRECT_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

const REDIRECT_PATH = "/auth/callback/google";

export async function POST(req: NextRequest) {
  // Require a valid Supabase session — prevents unauthenticated relay abuse
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expiry_date: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  });
}
