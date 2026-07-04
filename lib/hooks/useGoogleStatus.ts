"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";

export function useGoogleStatus() {
  const [conectado, setConectado] = useState<boolean | null>(null);
  const user = useUser();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("google_tokens")
      .select("user_id")
      .maybeSingle()
      .then(({ data }) => setConectado(!!data));
  }, [user]);

  async function desconectar() {
    if (!user) return;
    await supabase.from("google_tokens").delete().eq("user_id", user.id);
    setConectado(false);
  }

  return { conectado, desconectar };
}
