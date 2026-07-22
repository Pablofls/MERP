"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import type { Subtarea } from "../types";

type SubtareaDB = {
  id: string;
  pendiente_id: string;
  titulo: string;
  completado: boolean;
};

function fromDB(row: SubtareaDB): Subtarea {
  return {
    id: row.id,
    pendienteId: row.pendiente_id,
    titulo: row.titulo,
    completado: row.completado,
  };
}

export function useSubtareas(pendienteId: string | null) {
  const user = useUser();
  const [subtareas, setSubtareas] = useState<Subtarea[]>([]);

  useEffect(() => {
    if (!user || !pendienteId) { setSubtareas([]); return; }
    supabase
      .from("subtareas")
      .select("*")
      .eq("pendiente_id", pendienteId)
      .order("created_at")
      .then(({ data }) => {
        if (data) setSubtareas((data as SubtareaDB[]).map(fromDB));
      });
  }, [user, pendienteId]);

  async function agregar(titulo: string) {
    if (!user || !pendienteId || !titulo.trim()) return;
    const { data, error } = await supabase
      .from("subtareas")
      .insert({ pendiente_id: pendienteId, titulo: titulo.trim(), user_id: user.id })
      .select()
      .single();
    if (!error && data) setSubtareas((prev) => [...prev, fromDB(data as SubtareaDB)]);
  }

  async function toggleCompletar(id: string) {
    const actual = subtareas.find((s) => s.id === id);
    if (!actual) return;
    const completado = !actual.completado;
    setSubtareas((prev) => prev.map((s) => s.id === id ? { ...s, completado } : s));
    await supabase.from("subtareas").update({ completado }).eq("id", id);
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from("subtareas").delete().eq("id", id);
    if (!error) setSubtareas((prev) => prev.filter((s) => s.id !== id));
  }

  return { subtareas, agregar, toggleCompletar, eliminar };
}
