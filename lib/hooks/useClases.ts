"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useUser } from "../context/AuthContext";
import type { ClaseHorario } from "../types";

type ClaseDB = {
  id: string;
  materia_id: string;
  dia: ClaseHorario["dia"];
  hora_inicio: string;
  hora_fin: string;
  salon?: string | null;
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
    google_event_id: datos.googleEventId ?? null,
  };
}

export function useClases() {
  const user = useUser();
  const [clases, setClases] = useState<ClaseHorario[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clases")
      .select("*")
      .order("dia")
      .then(({ data }) => {
        if (data) setClases((data as ClaseDB[]).map(fromDB));
      });
  }, [user]);

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

  return { clases, agregar, editar, eliminar };
}
