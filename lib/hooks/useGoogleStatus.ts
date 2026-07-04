"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useCurrentUser } from "./useCurrentUser";

export function useGoogleStatus() {
  const [conectado, setConectado] = useState<boolean | null>(null);
  const user = useCurrentUser();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("google_tokens")
      .select("user_id")
      .maybeSingle()
      .then(({ data }) => setConectado(!!data));
  }, [user]);

  async function desconectar() {
    await supabase.from("google_tokens").delete().neq("user_id", "");
    setConectado(false);
  }

  return { conectado, desconectar };
}
