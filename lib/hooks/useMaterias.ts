"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import type { Materia } from "../types";

export function useMaterias() {
  const user = useUser();
  const [materias, setMaterias] = useState<Materia[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("materias")
      .select("*")
      .order("created_at")
      .then(({ data }) => {
        if (data) setMaterias(data);
      });
  }, [user]);

  async function agregar(datos: Omit<Materia, "id">) {
    if (!user) return;
    const { data, error } = await supabase
      .from("materias")
      .insert({ ...datos, user_id: user.id })
      .select()
      .single();
    if (!error && data) setMaterias((prev) => [...prev, data]);
  }

  async function editar(id: string, datos: Partial<Materia>) {
    const { data, error } = await supabase
      .from("materias")
      .update(datos)
      .eq("id", id)
      .select()
      .single();
    if (!error && data)
      setMaterias((prev) => prev.map((m) => (m.id === id ? data : m)));
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from("materias").delete().eq("id", id);
    if (!error) setMaterias((prev) => prev.filter((m) => m.id !== id));
  }

  return { materias, agregar, editar, eliminar };
}
