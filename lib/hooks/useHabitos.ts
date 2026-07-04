"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useCurrentUser } from "./useCurrentUser";
import type { Habito, RegistroHabito } from "../types";

type HabitoDB = {
  id: string;
  topico: string;
  tipo_medida: Habito["tipoMedida"];
  unidad?: string | null;
  activo: boolean;
};

type RegistroDB = {
  id: string;
  habito_id: string;
  fecha: string;
  valor: number;
};

function habitoFromDB(row: HabitoDB): Habito {
  return {
    id: row.id,
    topico: row.topico,
    tipoMedida: row.tipo_medida,
    unidad: row.unidad ?? undefined,
    activo: row.activo,
  };
}

function registroFromDB(row: RegistroDB): RegistroHabito {
  return { id: row.id, habitoId: row.habito_id, fecha: row.fecha, valor: row.valor };
}

export function useHabitos() {
  const user = useCurrentUser();
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [registros, setRegistros] = useState<RegistroHabito[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("habitos")
      .select("*")
      .order("created_at")
      .then(({ data }) => {
        if (data) setHabitos((data as HabitoDB[]).map(habitoFromDB));
      });

    supabase
      .from("registros_habito")
      .select("*")
      .order("fecha", { ascending: false })
      .then(({ data }) => {
        if (data) setRegistros((data as RegistroDB[]).map(registroFromDB));
      });
  }, [user]);

  async function agregarHabito(datos: Omit<Habito, "id" | "activo">) {
    if (!user) return;
    const { data, error } = await supabase
      .from("habitos")
      .insert({
        topico: datos.topico,
        tipo_medida: datos.tipoMedida,
        unidad: datos.unidad ?? null,
        activo: true,
        user_id: user.id,
      })
      .select()
      .single();
    if (!error && data) setHabitos((prev) => [...prev, habitoFromDB(data as HabitoDB)]);
  }

  async function editarHabito(id: string, datos: Partial<Habito>) {
    const patch: Record<string, unknown> = {};
    if (datos.topico !== undefined) patch.topico = datos.topico;
    if (datos.tipoMedida !== undefined) patch.tipo_medida = datos.tipoMedida;
    if (datos.unidad !== undefined) patch.unidad = datos.unidad ?? null;
    if (datos.activo !== undefined) patch.activo = datos.activo;

    const { data, error } = await supabase
      .from("habitos")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (!error && data)
      setHabitos((prev) => prev.map((h) => (h.id === id ? habitoFromDB(data as HabitoDB) : h)));
  }

  async function eliminarHabito(id: string) {
    const { error } = await supabase.from("habitos").delete().eq("id", id);
    if (!error) {
      setHabitos((prev) => prev.filter((h) => h.id !== id));
      setRegistros((prev) => prev.filter((r) => r.habitoId !== id));
    }
  }

  async function registrar(habitoId: string, fecha: string, valor: number) {
    if (!user) return;
    const { data, error } = await supabase
      .from("registros_habito")
      .upsert(
        { habito_id: habitoId, fecha, valor, user_id: user.id },
        { onConflict: "habito_id,fecha" }
      )
      .select()
      .single();
    if (!error && data) {
      const nuevo = registroFromDB(data as RegistroDB);
      setRegistros((prev) => {
        const sin = prev.filter((r) => !(r.habitoId === habitoId && r.fecha === fecha));
        return [nuevo, ...sin];
      });
    }
  }

  function getRegistro(habitoId: string, fecha: string) {
    return registros.find((r) => r.habitoId === habitoId && r.fecha === fecha);
  }

  function getHistorial(habitoId: string) {
    return registros
      .filter((r) => r.habitoId === habitoId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  function getRacha(habitoId: string): number {
    const hoy = new Date();
    const hoyKey = hoy.toISOString().split("T")[0];
    const hoyReg = registros.find((r) => r.habitoId === habitoId && r.fecha === hoyKey);

    // Si hoy no está marcado, contar desde ayer (el día de hoy aún puede registrarse)
    let fecha = new Date(hoy);
    if (!hoyReg || hoyReg.valor === 0) {
      fecha.setDate(fecha.getDate() - 1);
    }

    let racha = 0;
    while (true) {
      const key = fecha.toISOString().split("T")[0];
      const reg = registros.find((r) => r.habitoId === habitoId && r.fecha === key);
      if (!reg || reg.valor === 0) break;
      racha++;
      fecha.setDate(fecha.getDate() - 1);
    }
    return racha;
  }

  return {
    habitos,
    registros,
    agregarHabito,
    editarHabito,
    eliminarHabito,
    registrar,
    getRegistro,
    getHistorial,
    getRacha,
  };
}
