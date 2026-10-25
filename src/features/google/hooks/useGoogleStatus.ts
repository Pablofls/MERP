"use client";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/context/AuthContext";

/** Evento que disparan las llamadas a Google cuando el servidor responde "no_token". */
export const EVENTO_GOOGLE_DESCONECTADO = "google:desconectado";

export function avisarGoogleDesconectado() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_GOOGLE_DESCONECTADO));
}

export function useGoogleStatus() {
  const user = useUser();
  const qc = useQueryClient();
  const queryKey = ["google_status", user?.id ?? null];

  const { data } = useQuery({
    queryKey,
    // Pregunta al servidor si el token sigue funcionando; existir la fila no basta
    // (en modo Testing de GCP, Google invalida el refresh token a los 7 días).
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("sin sesión");
      const res = await fetch("/api/google/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("google_status");
      const json = await res.json();
      return !!json.conectado;
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    const revalidar = () => qc.invalidateQueries({ queryKey: ["google_status", userId] });
    window.addEventListener(EVENTO_GOOGLE_DESCONECTADO, revalidar);
    return () => window.removeEventListener(EVENTO_GOOGLE_DESCONECTADO, revalidar);
  }, [qc, userId]);

  async function desconectar() {
    if (!user) return;
    await supabase.from("google_tokens").delete().eq("user_id", user.id);
    qc.setQueryData(queryKey, false);
  }

  return { conectado: data ?? null, desconectar };
}
