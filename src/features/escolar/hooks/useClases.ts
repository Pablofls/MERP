"use client";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/context/AuthContext";
import { useCachedList, ok } from "@/lib/cache/useCachedList";
import type { ClaseHorario } from "@/lib/types";

type ClaseDB = {
  id: string;
  materia_id: string;
  dia: ClaseHorario["dia"];
  hora_inicio: string;
  hora_fin: string;
  salon?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  google_event_id?: string | null;
};

function fromDB(row: ClaseDB): ClaseHorario {
  return {
    id: row.id,
    materiaId: row.materia_id,
    dia: row.dia,
    horaInicio: row.hora_inicio.slice(0, 5),
    horaFin: row.hora_fin.slice(0, 5),
    salon: row.salon ?? undefined,
    fechaInicio: row.fecha_inicio ?? null,
    fechaFin: row.fecha_fin ?? null,
    googleEventId: row.google_event_id ?? null,
  };
}

function toDB(datos: Omit<ClaseHorario, "id">) {
  return {
    materia_id: datos.materiaId,
    dia: datos.dia,
    hora_inicio: datos.horaInicio,
    hora_fin: datos.horaFin,
    salon: datos.salon ?? null,
    fecha_inicio: datos.fechaInicio ?? null,
    fecha_fin: datos.fechaFin ?? null,
    google_event_id: datos.googleEventId ?? null,
  };
}

export const fetchClases = async (): Promise<ClaseHorario[]> =>
  ok(
    await supabase
      .from("clases")
      .select("id,materia_id,dia,hora_inicio,hora_fin,salon,fecha_inicio,fecha_fin,google_event_id")
      .order("dia")
  ).map((r) => fromDB(r as ClaseDB));

export function useClases() {
  const user = useUser();
  const [clases, setClases, cargando] = useCachedList<ClaseHorario>("clases", fetchClases);

  async function agregar(datos: Omit<ClaseHorario, "id">) {
    if (!user) return;
    const { data, error } = await supabase
      .from("clases")
      .insert({ ...toDB(datos), user_id: user.id })
      .select()
      .single();
    if (!error && data) setClases((prev) => [...prev, fromDB(data as ClaseDB)]);
  }

  async function editar(id: string, datos: Partial<ClaseHorario>) {
    const patch: Partial<ReturnType<typeof toDB>> = {};
    if (datos.materiaId !== undefined) patch.materia_id = datos.materiaId;
    if (datos.dia !== undefined) patch.dia = datos.dia;
    if (datos.horaInicio !== undefined) patch.hora_inicio = datos.horaInicio;
    if (datos.horaFin !== undefined) patch.hora_fin = datos.horaFin;
    if (datos.salon !== undefined) patch.salon = datos.salon ?? null;
    if (datos.fechaInicio !== undefined) patch.fecha_inicio = datos.fechaInicio ?? null;
    if (datos.fechaFin !== undefined) patch.fecha_fin = datos.fechaFin ?? null;
    if (datos.googleEventId !== undefined) patch.google_event_id = datos.googleEventId ?? null;

    const { data, error } = await supabase
      .from("clases")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (!error && data)
      setClases((prev) => prev.map((c) => (c.id === id ? fromDB(data as ClaseDB) : c)));
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from("clases").delete().eq("id", id);
    if (!error) setClases((prev) => prev.filter((c) => c.id !== id));
  }

  return { cargando, clases, agregar, editar, eliminar };
}
