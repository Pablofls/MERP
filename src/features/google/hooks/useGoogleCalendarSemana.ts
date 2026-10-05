"use client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/context/AuthContext";
import { useGoogleStatus } from "./useGoogleStatus";
import { fetchEventosGoogle, useCalendarioRefetch } from "./useGoogleCalendar";
import { DIAS_SEMANA } from "@/lib/utils";
import type { DiaSemana } from "@/lib/types";

export interface GoogleEventoSemana {
  id: string;
  titulo: string;
  descripcion?: string | null;
  hangoutLink?: string | null;
  dia: DiaSemana;
  horaInicio: string; // "HH:MM"
  horaFin: string;    // "HH:MM"
  inicioISO: string;
  finISO: string;
  recurringEventId: string | null;
}

function getLunesDeSemana(semanaOffset: number = 0): Date {
  const hoy = new Date();
  const dow = (hoy.getDay() + 6) % 7; // lunes = 0
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - dow + semanaOffset * 7);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function useGoogleCalendarSemana(semanaOffset: number = 0) {
  const user = useUser();
  const { conectado } = useGoogleStatus();
  const refetch = useCalendarioRefetch();

  const lunes = getLunesDeSemana(semanaOffset);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 7);

  const { data } = useQuery({
    queryKey: ["google_cal", user?.id ?? null, "semana", lunes.toISOString()],
    queryFn: async () => {
      // "YYYY-MM-DD" → DiaSemana
      const fechaADia = new Map<string, DiaSemana>();
      DIAS_SEMANA.forEach((dia, i) => {
        const d = new Date(lunes);
        d.setDate(lunes.getDate() + i);
        fechaADia.set(d.toISOString().split("T")[0], dia);
      });

      const mapped: GoogleEventoSemana[] = [];
      for (const e of await fetchEventosGoogle(lunes, domingo)) {
        if (e.todoElDia || !e.inicio || !e.fin) continue;
        const dia = fechaADia.get(e.inicio.split("T")[0]);
        if (!dia) continue;
        mapped.push({
          id: e.id,
          titulo: e.titulo,
          descripcion: e.descripcion ?? null,
          hangoutLink: e.hangoutLink ?? null,
          dia,
          horaInicio: formatHora(e.inicio),
          horaFin: formatHora(e.fin),
          inicioISO: e.inicio,
          finISO: e.fin,
          recurringEventId: e.recurringEventId ?? null,
        });
      }
      return mapped;
    },
    enabled: !!user && !!conectado,
  });

  return { eventos: data ?? [], refetch };
}
