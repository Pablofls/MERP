import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken, requireAuth } from "@/lib/server/google-auth";
import { checkRateLimit } from "@/lib/server/rate-limit";

const CAL_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

function isValidEventId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9_-]{1,1024}$/i.test(id);
}

function isValidISOString(v: unknown): v is string {
  return typeof v === "string" && !isNaN(Date.parse(v));
}

// Insert/replace UNTIL in a RRULE string (removes COUNT and existing UNTIL)
function applyUntil(rrule: string, untilISO: string): string {
  const d = new Date(untilISO);
  d.setSeconds(d.getSeconds() - 1); // one second before the first unwanted occurrence
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const until =
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  return rrule
    .replace(/;COUNT=\d+/g, "")
    .replace(/;UNTIL=[^;]*/g, "")
    + `;UNTIL=${until}`;
}

async function authAndRate(req: NextRequest): Promise<{ accessToken: string } | NextResponse> {
  if (!checkRateLimit(`cal:${getIp(req)}`, 30, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabaseToken = await requireAuth(req.headers.get("Authorization"));
  if (!supabaseToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accessToken = await getGoogleAccessToken(supabaseToken);
  if (!accessToken) return NextResponse.json({ ok: false, motivo: "no_token" });
  return { accessToken };
}

// GET /api/google/calendar?eventId=... — fetch a single event (for reading recurrence rules)
export async function GET(req: NextRequest) {
  const auth = await authAndRate(req);
  if (auth instanceof NextResponse) return auth;

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!isValidEventId(eventId))
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });

  const res = await fetch(`${CAL_BASE}/${encodeURIComponent(eventId)}?fields=id,recurrence`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  if (!res.ok) return NextResponse.json({ ok: false });
  const data = await res.json();
  return NextResponse.json({ ok: true, recurrence: data.recurrence ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await authAndRate(req);
  if (auth instanceof NextResponse) return auth;

  const { eventId, titulo, inicio, fin, editarTodos, baseEventId } = await req.json();

  if (!isValidEventId(eventId))
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
  if (editarTodos !== undefined && typeof editarTodos !== "boolean")
    return NextResponse.json({ error: "Invalid editarTodos" }, { status: 400 });
  if (editarTodos && !isValidEventId(baseEventId))
    return NextResponse.json({ error: "Invalid baseEventId" }, { status: 400 });
  if (titulo !== undefined && (typeof titulo !== "string" || titulo.length > 1000))
    return NextResponse.json({ error: "Invalid titulo" }, { status: 400 });
  if (inicio !== undefined && !isValidISOString(inicio))
    return NextResponse.json({ error: "Invalid inicio" }, { status: 400 });
  if (fin !== undefined && !isValidISOString(fin))
    return NextResponse.json({ error: "Invalid fin" }, { status: 400 });

  // When editing all occurrences, target the base (recurring) event
  const targetId = editarTodos && baseEventId ? baseEventId : eventId;

  const patch: Record<string, unknown> = {};
  if (titulo !== undefined) patch.summary = titulo;
  // Don't update times when editing the whole series (occurrence times ≠ base event times)
  if (!editarTodos) {
    if (inicio !== undefined) patch.start = { dateTime: inicio };
    if (fin !== undefined) patch.end = { dateTime: fin };
  }

  const res = await fetch(`${CAL_BASE}/${encodeURIComponent(targetId)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${auth.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!res.ok) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await authAndRate(req);
  if (auth instanceof NextResponse) return auth;

  const { eventId, scope, baseEventId, occurrenceStart } = await req.json();

  if (!isValidEventId(eventId))
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });

  const VALID_SCOPES = ["este", "todos", "siguientes"];
  if (scope !== undefined && !VALID_SCOPES.includes(scope))
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });

  // Delete all occurrences: delete the base (recurring) event
  if (scope === "todos") {
    if (!isValidEventId(baseEventId))
      return NextResponse.json({ error: "Invalid baseEventId" }, { status: 400 });
    const res = await fetch(`${CAL_BASE}/${encodeURIComponent(baseEventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok && res.status !== 204) return NextResponse.json({ ok: false });
    return NextResponse.json({ ok: true });
  }

  // Delete this and following: truncate the series RRULE with UNTIL
  if (scope === "siguientes") {
    if (!isValidEventId(baseEventId))
      return NextResponse.json({ error: "Invalid baseEventId" }, { status: 400 });
    if (!isValidISOString(occurrenceStart))
      return NextResponse.json({ error: "Invalid occurrenceStart" }, { status: 400 });

    // Fetch base event to get its current recurrence rules
    const getRes = await fetch(
      `${CAL_BASE}/${encodeURIComponent(baseEventId)}?fields=id,recurrence`,
      { headers: { Authorization: `Bearer ${auth.accessToken}` } }
    );
    if (!getRes.ok) return NextResponse.json({ ok: false });
    const baseData = await getRes.json();

    const recurrence: string[] = (baseData.recurrence ?? []).map((r: string) =>
      r.startsWith("RRULE:") ? applyUntil(r, occurrenceStart) : r
    );

    const patchRes = await fetch(`${CAL_BASE}/${encodeURIComponent(baseEventId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recurrence }),
    });
    if (!patchRes.ok) return NextResponse.json({ ok: false });
    return NextResponse.json({ ok: true });
  }

  // Default: delete only this occurrence
  const res = await fetch(`${CAL_BASE}/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  if (!res.ok && res.status !== 204) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const auth = await authAndRate(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { action, timeMin, timeMax } = body;

  const VALID_ACTIONS = ["crear", "listar"];
  if (action !== undefined && !VALID_ACTIONS.includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  // Crear evento
  if (action === "crear") {
    const { titulo, inicio, fin, todoElDia, recurrence } = body;
    if (!titulo || typeof titulo !== "string" || titulo.length > 1000)
      return NextResponse.json({ error: "Invalid titulo" }, { status: 400 });
    if (todoElDia) {
      const dateRE = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRE.test(inicio) || !dateRE.test(fin))
        return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
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
    const res = await fetch(CAL_BASE, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(evento),
    });
    if (!res.ok) return NextResponse.json({ ok: false });
    return NextResponse.json({ ok: true });
  }

  // Listar eventos
  if (!isValidISOString(timeMin) || !isValidISOString(timeMax))
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
    fields: "items(id,summary,start,end,status,colorId,recurringEventId)",
  });

  const res = await fetch(`${CAL_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

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
    recurringEventId?: string;
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
      recurringEventId: e.recurringEventId ?? null,
    }));

  return NextResponse.json({ ok: true, eventos });
}
