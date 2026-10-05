"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/context/AuthContext";

export function useGoogleStatus() {
  const user = useUser();
  const qc = useQueryClient();
  const queryKey = ["google_status", user?.id ?? null];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("google_tokens").select("user_id").maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  async function desconectar() {
    if (!user) return;
    await supabase.from("google_tokens").delete().eq("user_id", user.id);
    qc.setQueryData(queryKey, false);
  }

  return { conectado: data ?? null, desconectar };
}
