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

// Google Calendar event IDs are base32hex (a-v, 0-9), 5–1024 chars
function isValidEventId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9_-]{1,1024}$/i.test(id);
}

function isValidISOString(v: unknown): v is string {
  return typeof v === "string" && !isNaN(Date.parse(v));
}

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseToken = authHeader.slice(7);
  const { eventId, titulo, inicio, fin } = await req.json();

  if (!isValidEventId(eventId)) {
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
  }
  if (titulo !== undefined && (typeof titulo !== "string" || titulo.length > 1000)) {
    return NextResponse.json({ error: "Invalid titulo" }, { status: 400 });
  }
  if (inicio !== undefined && !isValidISOString(inicio)) {
    return NextResponse.json({ error: "Invalid inicio" }, { status: 400 });
  }
  if (fin !== undefined && !isValidISOString(fin)) {
    return NextResponse.json({ error: "Invalid fin" }, { status: 400 });
  }

  const accessToken = await getGoogleAccessToken(supabaseToken);
  if (!accessToken) return NextResponse.json({ ok: false, motivo: "no_token" });

  const patch: Record<string, unknown> = {};
  if (titulo !== undefined) patch.summary = titulo;
  if (inicio !== undefined) patch.start = { dateTime: inicio };
  if (fin !== undefined) patch.end = { dateTime: fin };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );

  if (!res.ok) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseToken = authHeader.slice(7);
  const { eventId } = await req.json();

  if (!isValidEventId(eventId)) {
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
  }

  const accessToken = await getGoogleAccessToken(supabaseToken);
  if (!accessToken) return NextResponse.json({ ok: false, motivo: "no_token" });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok && res.status !== 204) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseToken = authHeader.slice(7);
  const body = await req.json();
  const { action, timeMin, timeMax } = body;

  const VALID_ACTIONS = ["crear", "listar"];
  if (action !== undefined && !VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const accessToken = await getGoogleAccessToken(supabaseToken);
  if (!accessToken) return NextResponse.json({ ok: false, motivo: "no_token" });

  // Crear evento
  if (action === "crear") {
    const { titulo, inicio, fin, todoElDia } = body;
    if (!titulo || typeof titulo !== "string" || titulo.length > 1000) {
      return NextResponse.json({ error: "Invalid titulo" }, { status: 400 });
    }
    if (!todoElDia && (!isValidISOString(inicio) || !isValidISOString(fin))) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }
    const evento: Record<string, unknown> = { summary: titulo };
    if (todoElDia) {
      evento.start = { date: inicio };
      evento.end = { date: fin };
    } else {
      evento.start = { dateTime: inicio };
      evento.end = { dateTime: fin };
    }
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(evento),
      }
    );
    if (!res.ok) return NextResponse.json({ ok: false });
    return NextResponse.json({ ok: true });
  }

  if (!isValidISOString(timeMin) || !isValidISOString(timeMax)) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
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
