import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken, requireAuth } from "@/lib/server/google-auth";
import { checkRateLimit } from "@/lib/server/rate-limit";

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

// Google Tasks IDs are base64url encoded strings
function isValidTaskId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_=-]{1,1024}$/.test(id);
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`tasks:${getIp(req)}`, 30, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabaseToken = await requireAuth(req.headers.get("Authorization"));
  if (!supabaseToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { action, taskId, titulo, descripcion, fechaLimite, completado } = body;

  const VALID_ACTIONS = ["crear", "actualizar", "eliminar"];
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Basic input sanity checks
  if (titulo !== undefined && (typeof titulo !== "string" || titulo.length > 1000)) {
    return NextResponse.json({ error: "Invalid titulo" }, { status: 400 });
  }
  if (descripcion !== undefined && (typeof descripcion !== "string" || descripcion.length > 8000)) {
    return NextResponse.json({ error: "Invalid descripcion" }, { status: 400 });
  }
  if (fechaLimite !== undefined && fechaLimite !== null && !/^\d{4}-\d{2}-\d{2}$/.test(fechaLimite)) {
    return NextResponse.json({ error: "Invalid fechaLimite" }, { status: 400 });
  }

  const accessToken = await getGoogleAccessToken(supabaseToken);
  if (!accessToken) {
    return NextResponse.json({ ok: false, motivo: "no_token" });
  }

  const BASE = "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks";

  if (action === "crear") {
    if (!titulo?.trim()) return NextResponse.json({ error: "titulo required" }, { status: 400 });
    const taskBody: Record<string, string> = { title: titulo };
    if (descripcion) taskBody.notes = descripcion;
    if (fechaLimite) taskBody.due = `${fechaLimite}T00:00:00.000Z`;

    const res = await fetch(BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskBody),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Google Tasks API error:", err?.code ?? err?.status ?? "unknown");
      return NextResponse.json({ ok: false, motivo: "api_error" });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, taskId: data.id });
  }

  if ((action === "actualizar" || action === "eliminar") && !isValidTaskId(taskId)) {
    return NextResponse.json({ error: "Invalid taskId" }, { status: 400 });
  }

  if (action === "actualizar") {
    const patch: Record<string, string> = {};
    if (completado !== undefined) patch.status = completado ? "completed" : "needsAction";
    if (titulo) patch.title = titulo;
    if (descripcion !== undefined) patch.notes = descripcion ?? "";
    if (fechaLimite !== undefined) patch.due = fechaLimite ? `${fechaLimite}T00:00:00.000Z` : "";

    await fetch(`${BASE}/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "eliminar") {
    await fetch(`${BASE}/${encodeURIComponent(taskId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
