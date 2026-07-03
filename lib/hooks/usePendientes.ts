"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useCurrentUser } from "./useCurrentUser";
import { crearGoogleTask, actualizarGoogleTask, eliminarGoogleTask, editarContenidoGoogleTask } from "../google-tasks";
import type { Pendiente } from "../types";

type PendienteDB = {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fecha_limite?: string | null;
  completado: boolean;
  tipo: Pendiente["tipo"];
  materia_id?: string | null;
  google_task_id?: string | null;
};

function fromDB(row: PendienteDB): Pendiente {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion ?? undefined,
    fechaLimite: row.fecha_limite ?? undefined,
    completado: row.completado,
    tipo: row.tipo,
    materiaId: row.materia_id ?? undefined,
    googleTaskId: row.google_task_id ?? null,
  };
}

export function usePendientes() {
  const user = useCurrentUser();
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pendientes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPendientes((data as PendienteDB[]).map(fromDB));
      });
  }, [user]);

  async function agregar(datos: Omit<Pendiente, "id" | "completado">) {
    if (!user) return;

    // Crear en Supabase primero
    const { data, error } = await supabase
      .from("pendientes")
      .insert({
        titulo: datos.titulo,
        descripcion: datos.descripcion ?? null,
        fecha_limite: datos.fechaLimite ?? null,
        completado: false,
        tipo: datos.tipo,
        materia_id: datos.materiaId ?? null,
        google_task_id: null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) return;

    const pendiente = fromDB(data as PendienteDB);
    setPendientes((prev) => [pendiente, ...prev]);

    // Sincronizar con Google Tasks en segundo plano
    const googleTaskId = await crearGoogleTask(
      datos.titulo,
      datos.descripcion,
      datos.fechaLimite
    );

    if (googleTaskId) {
      await supabase
        .from("pendientes")
        .update({ google_task_id: googleTaskId })
        .eq("id", pendiente.id);
      setPendientes((prev) =>
        prev.map((p) => (p.id === pendiente.id ? { ...p, googleTaskId } : p))
      );
    }
  }

  async function toggleCompletado(id: string) {
    const actual = pendientes.find((p) => p.id === id);
    if (!actual) return;

    const { data, error } = await supabase
      .from("pendientes")
      .update({ completado: !actual.completado })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      const actualizado = fromDB(data as PendienteDB);
      setPendientes((prev) => prev.map((p) => (p.id === id ? actualizado : p)));

      // Sincronizar estado con Google Tasks
      if (actualizado.googleTaskId) {
        actualizarGoogleTask(actualizado.googleTaskId, actualizado.completado);
      }
    }
  }

  async function eliminar(id: string) {
    const pendiente = pendientes.find((p) => p.id === id);
    const { error } = await supabase.from("pendientes").delete().eq("id", id);
    if (!error) {
      setPendientes((prev) => prev.filter((p) => p.id !== id));
      // Eliminar de Google Tasks
      if (pendiente?.googleTaskId) {
        eliminarGoogleTask(pendiente.googleTaskId);
      }
    }
  }

  async function editar(id: string, datos: Partial<Pendiente>) {
    const patch: Record<string, unknown> = {};
    if (datos.titulo !== undefined) patch.titulo = datos.titulo;
    if (datos.descripcion !== undefined) patch.descripcion = datos.descripcion ?? null;
    if (datos.fechaLimite !== undefined) patch.fecha_limite = datos.fechaLimite ?? null;
    if (datos.tipo !== undefined) patch.tipo = datos.tipo;
    if (datos.materiaId !== undefined) patch.materia_id = datos.materiaId ?? null;

    const { data, error } = await supabase
      .from("pendientes")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      const actualizado = fromDB(data as PendienteDB);
      setPendientes((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
      if (actualizado.googleTaskId) {
        editarContenidoGoogleTask(
          actualizado.googleTaskId,
          actualizado.titulo,
          actualizado.descripcion,
          actualizado.fechaLimite
        );
      }
    }
  }

  return { pendientes, agregar, toggleCompletado, eliminar, editar };
}
