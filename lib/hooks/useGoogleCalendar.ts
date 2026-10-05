"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import { useGoogleStatus } from "./useGoogleStatus";

export interface GoogleEventoHoy {
  id: string;
  titulo: string;
  descripcion?: string | null;
  hangoutLink?: string | null;
  inicio: string | null;  // ISO dateTime string
  fin: string | null;
  todoElDia: boolean;
}

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

export function useGoogleCalendar(diaOffset: number = 0) {
  const user = useUser();
  const { conectado } = useGoogleStatus();
  const refetch = useCalendarioRefetch();

  const base = new Date();
  base.setDate(base.getDate() + diaOffset);
  const inicio = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const fin = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);

  const { data, isFetching } = useQuery({
    // clave por fecha (no por offset) para que la caché persistida no se desfase al cambiar de día
    queryKey: ["google_cal", user?.id ?? null, "dia", inicio.toISOString()],
    queryFn: async () => (await fetchEventosGoogle(inicio, fin)) as GoogleEventoHoy[],
    enabled: !!user && !!conectado,
  });

  return { eventos: data ?? [], cargando: isFetching, refetch };
}
