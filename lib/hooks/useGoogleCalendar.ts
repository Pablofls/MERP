"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useCurrentUser } from "./useCurrentUser";
import { useGoogleStatus } from "./useGoogleStatus";

export interface GoogleEventoHoy {
  id: string;
  titulo: string;
  inicio: string | null;  // ISO dateTime string
  fin: string | null;
  todoElDia: boolean;
}

export function useGoogleCalendar(diaOffset: number = 0) {
  const user = useCurrentUser();
  const { conectado } = useGoogleStatus();
  const [eventos, setEventos] = useState<GoogleEventoHoy[]>([]);
  const [cargando, setCargando] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user || !conectado) return;

    const base = new Date();
    base.setDate(base.getDate() + diaOffset);
    const inicio = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const fin = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);

    async function fetchEventos() {
      setCargando(true);
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
            timeMin: inicio.toISOString(),
            timeMax: fin.toISOString(),
          }),
        });

        const data = await res.json();
        if (data.ok) setEventos(data.eventos);
      } catch {
        // silently fail — calendar is optional
      } finally {
        setCargando(false);
      }
    }

    fetchEventos();
  }, [user, conectado, version, diaOffset]);

  return { eventos, cargando, refetch: () => setVersion((v) => v + 1) };
}
