"use client";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/context/AuthContext";
import { useCachedList, ok } from "@/lib/cache/useCachedList";
import type { User } from "@supabase/supabase-js";
import type { CategoriaPersonal } from "@/lib/types";

const DEFAULTS: { nombre: string; color: string }[] = [
  { nombre: "Personal", color: "#4a3a6b" },
];

type CategoriaDB = { id: string; nombre: string; color: string; user_id: string; created_at: string };

function fromDB(row: CategoriaDB): CategoriaPersonal {
  return { id: row.id, nombre: row.nombre, color: row.color };
}

const COLUMNAS_CATEGORIA = "id,nombre,color,user_id,created_at";

const leerCategorias = async () =>
  ok(
    await supabase
      .from("categorias_personales")
      .select(COLUMNAS_CATEGORIA)
      .order("created_at", { ascending: true })
  ) as CategoriaDB[];

export const fetchCategorias = async (u: User): Promise<CategoriaPersonal[]> => {
  const data = await leerCategorias();
  if (data.length > 0) return data.map(fromDB);
  const inserts = DEFAULTS.map((d) => ({ ...d, user_id: u.id }));
  const sembrado = await supabase.from("categorias_personales").insert(inserts).select();
  // Si otra consulta concurrente ya sembró las categorías, el índice único (user_id, nombre) rechaza
  // este insert: se relee en vez de fallar
  if (sembrado.error) return (await leerCategorias()).map(fromDB);
  return (ok(sembrado) as CategoriaDB[]).map(fromDB);
};

export function useCategorias() {
  const user = useUser();
  const [categorias, setCategorias] = useCachedList<CategoriaPersonal>("categorias", fetchCategorias);

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
