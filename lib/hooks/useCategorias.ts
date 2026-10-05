"use client";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import { useCachedList, ok } from "../cache/useCachedList";
import type { CategoriaPersonal } from "../types";

const DEFAULTS: { nombre: string; color: string }[] = [
  { nombre: "Personal", color: "#4a3a6b" },
];

type CategoriaDB = { id: string; nombre: string; color: string; user_id: string; created_at: string };

function fromDB(row: CategoriaDB): CategoriaPersonal {
  return { id: row.id, nombre: row.nombre, color: row.color };
}

export function useCategorias() {
  const user = useUser();
  const [categorias, setCategorias] = useCachedList<CategoriaPersonal>("categorias", async (u) => {
    const data = ok(
      await supabase.from("categorias_personales").select("*").order("created_at", { ascending: true })
    ) as CategoriaDB[];
    if (data.length > 0) return data.map(fromDB);
    const inserts = DEFAULTS.map((d) => ({ ...d, user_id: u.id }));
    const seeded = ok(await supabase.from("categorias_personales").insert(inserts).select()) as CategoriaDB[];
    return seeded.map(fromDB);
  });

  async function agregar(nombre: string, color: string) {
    if (!user || !nombre.trim()) return;
    const { data } = await supabase
      .from("categorias_personales")
      .insert({ nombre: nombre.trim(), color, user_id: user.id })
      .select()
      .single();
    if (data) setCategorias((prev) => [...prev, fromDB(data as CategoriaDB)]);
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from("categorias_personales").delete().eq("id", id);
    if (!error) setCategorias((prev) => prev.filter((c) => c.id !== id));
  }

  return { categorias, agregar, eliminar };
}
