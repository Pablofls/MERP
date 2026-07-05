"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import { useGoogleStatus } from "./useGoogleStatus";
import { DIAS_SEMANA } from "../utils";
import type { DiaSemana } from "../types";

export interface GoogleEventoSemana {
  id: string;
  titulo: string;
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
  const [eventos, setEventos] = useState<GoogleEventoSemana[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user || !conectado) return;

    const lunes = getLunesDeSemana(semanaOffset);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 7);

    // Build map: "YYYY-MM-DD" → DiaSemana
    const fechaADia = new Map<string, DiaSemana>();
    DIAS_SEMANA.forEach((dia, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      fechaADia.set(d.toISOString().split("T")[0], dia);
    });

    async function fetchSemana() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch("/api/google/calendar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            timeMin: lunes.toISOString(),
            timeMax: domingo.toISOString(),
          }),
        });

        const data = await res.json();
        if (!data.ok) return;

        const mapped: GoogleEventoSemana[] = [];
        for (const e of data.eventos) {
          if (e.todoElDia || !e.inicio || !e.fin) continue;
          const fecha = e.inicio.split("T")[0];
          const dia = fechaADia.get(fecha);
          if (!dia) continue;
          mapped.push({
            id: e.id,
            titulo: e.titulo,
            dia,
            horaInicio: formatHora(e.inicio),
            horaFin: formatHora(e.fin),
            inicioISO: e.inicio,
            finISO: e.fin,
            recurringEventId: e.recurringEventId ?? null,
          });
        }
        setEventos(mapped);
      } catch {
        // calendario es opcional
      }
    }

    fetchSemana();
  }, [user, conectado, version, semanaOffset]);

  return { eventos, refetch: () => setVersion((v) => v + 1) };
}
