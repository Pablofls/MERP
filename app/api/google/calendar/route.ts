import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getGoogleAccessToken(supabaseToken: string): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });

  const { data } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .maybeSingle();

  if (!data?.refresh_token) return null;

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: data.refresh_token,
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

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseToken = authHeader.slice(7);
  const { timeMin, timeMax } = await req.json();

  const accessToken = await getGoogleAccessToken(supabaseToken);
  if (!accessToken) {
    return NextResponse.json({ ok: false, motivo: "no_token" });
  }

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
    fields: "items(id,summary,start,end,status,colorId)",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Google Calendar error:", JSON.stringify(err));
    return NextResponse.json({ ok: false, motivo: "api_error" });
  }

  const data = await res.json();

  type GCalItem = {
    id: string;
    summary?: string;
    status?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
  };

  const eventos = ((data.items ?? []) as GCalItem[])
    .filter((e) => e.status !== "cancelled")
    .map((e) => ({
      id: e.id,
      titulo: e.summary ?? "(Sin título)",
      inicio: e.start?.dateTime ?? null,
      fin: e.end?.dateTime ?? null,
      todoElDia: !!e.start?.date,
    }));

  return NextResponse.json({ ok: true, eventos });
}
