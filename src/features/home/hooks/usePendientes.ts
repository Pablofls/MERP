"use client";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/context/AuthContext";
import { useCachedList, ok } from "@/lib/cache/useCachedList";
import { crearGoogleTask, actualizarGoogleTask, eliminarGoogleTask, editarContenidoGoogleTask } from "@/features/google/lib/google-tasks";
import type { Pendiente } from "@/lib/types";

type PendienteDB = {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fecha_limite?: string | null;
  completado: boolean;
  tipo: Pendiente["tipo"];
  materia_id?: string | null;
  categoria_personal_id?: string | null;
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
    categoriaPersonalId: row.categoria_personal_id ?? undefined,
    googleTaskId: row.google_task_id ?? null,
  };
}

const COLUMNAS =
  "id,titulo,descripcion,fecha_limite,completado,tipo,materia_id,categoria_personal_id,google_task_id";

// Los pendientes completados de hace más de 90 días no se cargan (los activos siempre)
function desdeCompletados() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString();
}

export const fetchPendientes = async (): Promise<Pendiente[]> =>
  ok(
    await supabase
      .from("pendientes")
      .select(COLUMNAS)
      .or(`completado.eq.false,created_at.gte.${desdeCompletados()}`)
      .order("created_at", { ascending: false })
  ).map((r) => fromDB(r as PendienteDB));

export function usePendientes() {
  const user = useUser();
  const [pendientes, setPendientes, cargando] = useCachedList<Pendiente>("pendientes", fetchPendientes);

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
        categoria_personal_id: datos.categoriaPersonalId ?? null,
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

    const nuevoCompletado = !actual.completado;

    // Optimistic update: actualizar estado local antes del await para que el
    // filtro elimine el item en el mismo ciclo de render que termina la animación.
    setPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completado: nuevoCompletado } : p))
    );

    const { data, error } = await supabase
      .from("pendientes")
      .update({ completado: nuevoCompletado })
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
    } else {
      // Rollback si falla la llamada a Supabase
      setPendientes((prev) => prev.map((p) => (p.id === id ? actual : p)));
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
    if (datos.categoriaPersonalId !== undefined) patch.categoria_personal_id = datos.categoriaPersonalId ?? null;

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
      } else if (actualizado.fechaLimite) {
        // Pendiente sin Google Task que ahora tiene fecha: crearlo
        const googleTaskId = await crearGoogleTask(
          actualizado.titulo,
          actualizado.descripcion,
          actualizado.fechaLimite
        );
        if (googleTaskId) {
          await supabase
            .from("pendientes")
            .update({ google_task_id: googleTaskId })
            .eq("id", id);
          setPendientes((prev) =>
            prev.map((p) => (p.id === id ? { ...p, googleTaskId } : p))
          );
        }
      }
    }
  }

  return { cargando, pendientes, agregar, toggleCompletado, eliminar, editar };
}
