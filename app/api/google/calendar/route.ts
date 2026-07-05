import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken, requireAuth } from "@/lib/server/google-auth";
import { checkRateLimit } from "@/lib/server/rate-limit";

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

// Google Calendar event IDs are base32hex (a-v, 0-9), 5–1024 chars
function isValidEventId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9_-]{1,1024}$/i.test(id);
}

function isValidISOString(v: unknown): v is string {
  return typeof v === "string" && !isNaN(Date.parse(v));
}

export async function PATCH(req: NextRequest) {
  if (!checkRateLimit(`cal:${getIp(req)}`, 30, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabaseToken = await requireAuth(req.headers.get("Authorization"));
  if (!supabaseToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  if (!checkRateLimit(`cal:${getIp(req)}`, 30, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabaseToken = await requireAuth(req.headers.get("Authorization"));
  if (!supabaseToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  if (!checkRateLimit(`cal:${getIp(req)}`, 30, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabaseToken = await requireAuth(req.headers.get("Authorization"));
  if (!supabaseToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const { titulo, inicio, fin, todoElDia, recurrence } = body;
    if (!titulo || typeof titulo !== "string" || titulo.length > 1000) {
      return NextResponse.json({ error: "Invalid titulo" }, { status: 400 });
    }
    if (todoElDia) {
      const dateRE = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRE.test(inicio) || !dateRE.test(fin)) {
        return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
      }
    } else if (!isValidISOString(inicio) || !isValidISOString(fin)) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (recurrence !== undefined) {
      const RRULE_RE = /^RRULE:FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z0-9=,+\-:]+)*$/;
      if (
        !Array.isArray(recurrence) ||
        recurrence.length > 5 ||
        recurrence.some((r: unknown) => typeof r !== "string" || !RRULE_RE.test(r))
      ) {
        return NextResponse.json({ error: "Invalid recurrence" }, { status: 400 });
      }
    }
    const evento: Record<string, unknown> = { summary: titulo };
    if (todoElDia) {
      evento.start = { date: inicio };
      evento.end = { date: fin };
    } else {
      evento.start = { dateTime: inicio };
      evento.end = { dateTime: fin };
    }
    if (recurrence) evento.recurrence = recurrence;
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
    console.error("Google Calendar API error:", err?.code ?? err?.status ?? "unknown");
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
