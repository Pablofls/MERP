"use client";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import { useCachedList, ok } from "../cache/useCachedList";
import type { Materia } from "../types";

export function useMaterias() {
  const user = useUser();
  const [materias, setMaterias] = useCachedList<Materia>("materias", async () =>
    ok(await supabase.from("materias").select("*").order("created_at")) as Materia[]
  );

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
