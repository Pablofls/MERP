"use client";
import { supabase } from "./supabase";

async function getValidToken(): Promise<string | null> {
  const { data } = await supabase
    .from("google_tokens")
    .select("access_token, refresh_token, expiry_date")
    .maybeSingle();

  if (!data) return null;

  // Si el token expira en menos de 5 minutos, lo refrescamos
  if (data.expiry_date && Date.now() > data.expiry_date - 5 * 60 * 1000) {
    if (!data.refresh_token) return null;

    const res = await fetch("/api/google/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: data.refresh_token }),
    });

    if (!res.ok) return null;

    const { access_token, expiry_date } = await res.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("google_tokens")
        .update({ access_token, expiry_date, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    return access_token;
  }

  return data.access_token;
}

export async function crearGoogleTask(
  titulo: string,
  descripcion?: string,
  fechaLimite?: string
): Promise<string | null> {
  const token = await getValidToken();
  if (!token) return null;

  const body: Record<string, string> = { title: titulo };
  if (descripcion) body.notes = descripcion;
  if (fechaLimite) body.due = `${fechaLimite}T00:00:00.000Z`;

  const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

export async function actualizarGoogleTask(taskId: string, completado: boolean): Promise<void> {
  const token = await getValidToken();
  if (!token) return;

  await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: completado ? "completed" : "needsAction" }),
  });
}

export async function eliminarGoogleTask(taskId: string): Promise<void> {
  const token = await getValidToken();
  if (!token) return;

  await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
