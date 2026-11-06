"use client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/context/AuthContext";
import { useGoogleStatus } from "./useGoogleStatus";
import { fetchEventosGoogle, useCalendarioRefetch } from "./useGoogleCalendar";
import type { EventoGoogle } from "@/features/home/lib/agendaDia";

/** Eventos de Google Calendar del mes que contiene `mesRef`. */
export function useGoogleCalendarMes(mesRef: Date) {
  const user = useUser();
  const { conectado } = useGoogleStatus();
  const refetch = useCalendarioRefetch();

  const inicio = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const fin = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);

  const { data, isFetching } = useQuery({
    // empieza con "google_cal" para que useCalendarioRefetch también lo invalide
    queryKey: ["google_cal", user?.id ?? null, "mes", inicio.toISOString()],
    queryFn: async () => (await fetchEventosGoogle(inicio, fin)) as EventoGoogle[],
    enabled: !!user && !!conectado,
  });

  return { eventos: data ?? [], cargando: isFetching, refetch };
}
