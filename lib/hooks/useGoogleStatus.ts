"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export function useGoogleStatus() {
  const [conectado, setConectado] = useState<boolean | null>(null);

  useEffect(() => {
    supabase
      .from("google_tokens")
      .select("user_id")
      .maybeSingle()
      .then(({ data }) => setConectado(!!data));
  }, []);

  async function desconectar() {
    await supabase.from("google_tokens").delete().neq("user_id", "");
    setConectado(false);
  }

  return { conectado, desconectar };
}
