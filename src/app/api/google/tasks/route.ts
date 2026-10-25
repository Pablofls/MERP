import { NextRequest, NextResponse } from "next/server";
import { googleFetch, requireAuth } from "@/features/google/server/google-auth";
import { TASKS_BASE, cuerpoTarea, dueDesdeFecha } from "@/features/google/server/google-tasks-api";
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

  const sinToken = () => NextResponse.json({ ok: false, motivo: "no_token" });

  if (action === "crear") {
    if (!titulo?.trim()) return NextResponse.json({ error: "titulo required" }, { status: 400 });
    const res = await googleFetch(supabaseToken, TASKS_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpoTarea(titulo, descripcion, fechaLimite)),
    });
    if (!res) return sinToken();

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
    if (fechaLimite !== undefined) patch.due = fechaLimite ? dueDesdeFecha(fechaLimite) : "";

    const patchRes = await googleFetch(supabaseToken, `${TASKS_BASE}/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!patchRes) return sinToken();
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      console.error("Google Tasks PATCH error:", err?.error?.code ?? patchRes.status);
      return NextResponse.json({ ok: false, motivo: "api_error" });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "eliminar") {
    const delRes = await googleFetch(supabaseToken, `${TASKS_BASE}/${encodeURIComponent(taskId)}`, {
      method: "DELETE",
    });
    if (!delRes) return sinToken();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
