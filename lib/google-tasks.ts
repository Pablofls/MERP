"use client";
import { supabase } from "./supabase";

async function callTasksAPI(body: Record<string, unknown>): Promise<Response | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  return fetch("/api/google/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
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
