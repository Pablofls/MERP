"use client";
import { supabase } from "@/lib/supabase";
import { avisarGoogleDesconectado } from "@/features/google/hooks/useGoogleStatus";

async function callTasksAPI(body: Record<string, unknown>): Promise<Response | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const res = await fetch("/api/google/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  // Si Google ya no acepta el token, que el indicador de conexión se actualice al momento
  res.clone().json().then((d) => { if (d?.motivo === "no_token") avisarGoogleDesconectado(); }).catch(() => {});
  return res;
}

export async function crearGoogleTask(
  titulo: string,
  descripcion?: string,
  fechaLimite?: string
): Promise<string | null> {
  const res = await callTasksAPI({ action: "crear", titulo, descripcion, fechaLimite });
  if (!res?.ok) return null;
  const data = await res.json();
  return data.ok ? (data.taskId ?? null) : null;
}

export async function actualizarGoogleTask(taskId: string, completado: boolean): Promise<void> {
  await callTasksAPI({ action: "actualizar", taskId, completado });
}

export async function editarContenidoGoogleTask(
  taskId: string,
  titulo: string,
  descripcion?: string,
  fechaLimite?: string
): Promise<void> {
  await callTasksAPI({ action: "actualizar", taskId, titulo, descripcion, fechaLimite });
}

export async function eliminarGoogleTask(taskId: string): Promise<void> {
  await callTasksAPI({ action: "eliminar", taskId });
}

export type ResultadoSync = { creadas: number; actualizadas: number };

/** Publica en Google los pendientes que faltan y alinea su estado con MERP. */
export async function sincronizarGoogleTasks(): Promise<ResultadoSync | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const res = await fetch("/api/google/tasks/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const data = await res.json().catch(() => null);
  if (data?.motivo === "no_token") avisarGoogleDesconectado();
  if (!res.ok || !data?.ok) return null;
  return { creadas: data.creadas, actualizadas: data.actualizadas };
}
