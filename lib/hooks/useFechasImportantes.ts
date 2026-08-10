"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import type { FechaImportante } from "../types";

type FechaImportanteDB = {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fecha: string;
  materia_id?: string | null;
  tipo: FechaImportante["tipo"];
  completado: boolean;
};

function fromDB(row: FechaImportanteDB): FechaImportante {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion ?? undefined,
    fecha: row.fecha,
    materiaId: row.materia_id ?? undefined,
    tipo: row.tipo,
    completado: row.completado,
  };
}

export function useFechasImportantes() {
  const user = useUser();
  const [fechas, setFechas] = useState<FechaImportante[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("fechas_importantes")
      .select("*")
      .order("fecha", { ascending: true })
      .then(({ data }) => {
        if (data) setFechas((data as FechaImportanteDB[]).map(fromDB));
      });
  }, [user]);

  async function agregar(datos: Omit<FechaImportante, "id" | "completado">) {
    if (!user) return;
    const { data, error } = await supabase
      .from("fechas_importantes")
      .insert({
        titulo: datos.titulo,
        descripcion: datos.descripcion ?? null,
        fecha: datos.fecha,
        materia_id: datos.materiaId ?? null,
        tipo: datos.tipo,
        completado: false,
        user_id: user.id,
      })
      .select()
      .single();
    if (!error && data) setFechas((prev) => [...prev, fromDB(data as FechaImportanteDB)].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  }

  async function editar(id: string, datos: Partial<Omit<FechaImportante, "id">>) {
    const patch: Record<string, unknown> = {};
    if (datos.titulo !== undefined) patch.titulo = datos.titulo;
    if (datos.descripcion !== undefined) patch.descripcion = datos.descripcion ?? null;
    if (datos.fecha !== undefined) patch.fecha = datos.fecha;
    if (datos.materiaId !== undefined) patch.materia_id = datos.materiaId ?? null;
    if (datos.tipo !== undefined) patch.tipo = datos.tipo;

    const { data, error } = await supabase
      .from("fechas_importantes")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setFechas((prev) =>
        prev.map((f) => (f.id === id ? fromDB(data as FechaImportanteDB) : f)).sort((a, b) => a.fecha.localeCompare(b.fecha))
      );
    }
  }

  async function toggleCompletado(id: string) {
    const actual = fechas.find((f) => f.id === id);
    if (!actual) return;
    const nuevoCompletado = !actual.completado;
    setFechas((prev) => prev.map((f) => (f.id === id ? { ...f, completado: nuevoCompletado } : f)));
    const { error } = await supabase
      .from("fechas_importantes")
      .update({ completado: nuevoCompletado })
      .eq("id", id);
    if (error) setFechas((prev) => prev.map((f) => (f.id === id ? actual : f)));
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from("fechas_importantes").delete().eq("id", id);
    if (!error) setFechas((prev) => prev.filter((f) => f.id !== id));
  }

  return { fechas, agregar, editar, toggleCompletado, eliminar };
}
