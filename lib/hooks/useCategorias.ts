"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import type { CategoriaPersonal } from "../types";

const DEFAULTS: { nombre: string; color: string }[] = [
  { nombre: "Personal", color: "#4a3a6b" },
  { nombre: "Morfosys", color: "#1a5c3e" },
  { nombre: "Kenet", color: "#2d6090" },
];

type CategoriaDB = { id: string; nombre: string; color: string; user_id: string; created_at: string };

function fromDB(row: CategoriaDB): CategoriaPersonal {
  return { id: row.id, nombre: row.nombre, color: row.color };
}

export function useCategorias() {
  const user = useUser();
  const [categorias, setCategorias] = useState<CategoriaPersonal[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("categorias_personales")
      .select("*")
      .order("created_at", { ascending: true })
      .then(async ({ data }) => {
        if (!data) return;
        if (data.length > 0) {
          setCategorias((data as CategoriaDB[]).map(fromDB));
        } else {
          const inserts = DEFAULTS.map((d) => ({ ...d, user_id: user.id }));
          const { data: seeded } = await supabase
            .from("categorias_personales")
            .insert(inserts)
            .select();
          if (seeded) setCategorias((seeded as CategoriaDB[]).map(fromDB));
        }
      });
  }, [user]);

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
