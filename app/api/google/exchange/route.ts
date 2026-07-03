import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code, redirectUri } = await req.json();

  if (!code || !redirectUri) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
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
