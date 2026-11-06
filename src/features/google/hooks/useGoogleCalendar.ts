"use client";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/** Pide eventos de Google Calendar al backend; lanza si falla para conservar la caché previa. */
export async function fetchEventosGoogle(timeMin: Date, timeMax: Date) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("sin sesión");

  const res = await fetch("/api/google/calendar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error("calendar");
  return data.eventos as any[];
}

export function useCalendarioRefetch() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["google_cal"] });
}
