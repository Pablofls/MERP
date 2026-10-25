import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { googleFetch, requireAuth } from "@/features/google/server/google-auth";
import { TASKS_BASE, cuerpoTarea, dueDesdeFecha } from "@/features/google/server/google-tasks-api";
import { checkRateLimit } from "@/lib/server/rate-limit";

type PendienteSync = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  completado: boolean;
  google_task_id: string | null;
};

type GoogleTask = { id: string; title?: string; notes?: string; due?: string; status?: string };

class SinToken extends Error {}

// POST /api/google/tasks/sync — reconcilia Google Tasks con MERP (MERP manda):
// publica los pendientes que no llegaron a Google y corrige estado/título/notas/fecha
// de los que sí. Pensado para después de reconectar Google.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(`tasks-sync:${ip}`, 5, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabaseToken = await requireAuth(req.headers.get("Authorization"));
  if (!supabaseToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${supabaseToken}` } } },
  );

  async function google(url: string, init?: RequestInit) {
    const res = await googleFetch(supabaseToken!, url, init);
    if (!res) throw new SinToken();
    return res;
  }

  try {
    // 1. Todas las tareas de la lista de Google (incluidas las completadas)
    const tareas = new Map<string, GoogleTask>();
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        showCompleted: "true",
        showHidden: "true",
        maxResults: "100",
        fields: "nextPageToken,items(id,title,notes,due,status)",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await google(`${TASKS_BASE}?${params}`);
      if (!res.ok) return NextResponse.json({ ok: false, motivo: "api_error" });
      const data = await res.json();
      for (const t of (data.items ?? []) as GoogleTask[]) tareas.set(t.id, t);
      pageToken = data.nextPageToken;
    } while (pageToken);

    // 2. Pendientes de MERP: mismo alcance que la app (activos + completados de 90 días)
    const desde = new Date();
    desde.setDate(desde.getDate() - 90);
    const { data: pendientes, error } = await supabase
      .from("pendientes")
      .select("id,titulo,descripcion,fecha_limite,completado,google_task_id")
      .or(`completado.eq.false,created_at.gte.${desde.toISOString()}`);
    if (error || !pendientes) return NextResponse.json({ ok: false, motivo: "db_error" });

    let creadas = 0;
    let actualizadas = 0;

    // 3. Reconciliar uno por uno (en serie para no topar la cuota de Google)
    for (const p of pendientes as PendienteSync[]) {
      const tarea = p.google_task_id ? tareas.get(p.google_task_id) : undefined;

      if (!tarea) {
        // Nunca se publicó, o se borró en Google
        if (p.completado) {
          // No llenar Google de tareas ya hechas; solo soltar el id huérfano
          if (p.google_task_id)
            await supabase.from("pendientes").update({ google_task_id: null }).eq("id", p.id);
          continue;
        }
        const res = await google(TASKS_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuerpoTarea(p.titulo, p.descripcion, p.fecha_limite)),
        });
        if (!res.ok) continue;
        const creada = await res.json();
        await supabase.from("pendientes").update({ google_task_id: creada.id }).eq("id", p.id);
        creadas++;
        continue;
      }

      const patch: Record<string, string | null> = {};
      const status = p.completado ? "completed" : "needsAction";
      if (tarea.status !== status) patch.status = status;
      if ((tarea.title ?? "") !== p.titulo) patch.title = p.titulo;
      if ((tarea.notes ?? "") !== (p.descripcion ?? "")) patch.notes = p.descripcion ?? "";
      if ((tarea.due?.slice(0, 10) ?? null) !== (p.fecha_limite ?? null))
        patch.due = p.fecha_limite ? dueDesdeFecha(p.fecha_limite) : null;
      if (Object.keys(patch).length === 0) continue;

      const res = await google(`${TASKS_BASE}/${encodeURIComponent(tarea.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) actualizadas++;
    }

    return NextResponse.json({ ok: true, creadas, actualizadas });
  } catch (e) {
    if (e instanceof SinToken) return NextResponse.json({ ok: false, motivo: "no_token" });
    throw e;
  }
}
