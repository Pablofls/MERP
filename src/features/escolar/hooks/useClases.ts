"use client";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/context/AuthContext";
import { useCachedList, ok } from "@/lib/cache/useCachedList";
import type { ClaseHorario, DiaSemana } from "@/lib/types";

// En la BD una clase (`clases`) se repite en varios días (`clase_dias`, 4FN).
// El resto de la app sigue viendo una ClaseHorario por día: aquí se aplana y se vuelve a separar.
type ClaseDB = {
  id: string;
  materia_id: string;
  hora_inicio: string;
  hora_fin: string;
  salon?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  google_event_id?: string | null;
  clase_dias: { dia: DiaSemana }[];
};

const COLUMNAS = "id,materia_id,hora_inicio,hora_fin,salon,fecha_inicio,fecha_fin,google_event_id,clase_dias(dia)";

const ORDEN_DIAS: DiaSemana[] = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export const idOcurrencia = (claseId: string, dia: DiaSemana) => `${claseId}:${dia}`;

function aplanar(row: ClaseDB): ClaseHorario[] {
  return row.clase_dias.map(({ dia }) => ({
    id: idOcurrencia(row.id, dia),
    claseId: row.id,
    materiaId: row.materia_id,
    dia,
    horaInicio: row.hora_inicio.slice(0, 5),
    horaFin: row.hora_fin.slice(0, 5),
    salon: row.salon ?? undefined,
    fechaInicio: row.fecha_inicio ?? null,
    fechaFin: row.fecha_fin ?? null,
    googleEventId: row.google_event_id ?? null,
  }));
}

export type NuevaClase = Omit<ClaseHorario, "id" | "claseId" | "dia"> & { dias: DiaSemana[] };

export const fetchClases = async (): Promise<ClaseHorario[]> =>
  ok(await supabase.from("clases").select(COLUMNAS).order("created_at"))
    .flatMap((r) => aplanar(r as unknown as ClaseDB))
    .sort((a, b) => ORDEN_DIAS.indexOf(a.dia) - ORDEN_DIAS.indexOf(b.dia));

export function useClases() {
  const user = useUser();
  const [clases, setClases, cargando] = useCachedList<ClaseHorario>("clases_v2", fetchClases);

  async function agregar(datos: NuevaClase) {
    if (!user || datos.dias.length === 0) return;
    const { data, error } = await supabase
      .from("clases")
      .insert({
        materia_id: datos.materiaId,
        hora_inicio: datos.horaInicio,
        hora_fin: datos.horaFin,
        salon: datos.salon ?? null,
        fecha_inicio: datos.fechaInicio ?? null,
        fecha_fin: datos.fechaFin ?? null,
        google_event_id: datos.googleEventId ?? null,
        user_id: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return;

    const dias = [...new Set(datos.dias)];
    const { error: errDias } = await supabase
      .from("clase_dias")
      .insert(dias.map((dia) => ({ clase_id: data.id, dia, user_id: user.id })));
    if (errDias) {
      // Sin días la clase no se vería en ningún horario: no dejar la fila huérfana
      await supabase.from("clases").delete().eq("id", data.id);
      return;
    }

    const nuevas = dias.map<ClaseHorario>((dia) => ({
      id: idOcurrencia(data.id, dia),
      claseId: data.id,
      materiaId: datos.materiaId,
      dia,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      salon: datos.salon,
      fechaInicio: datos.fechaInicio ?? null,
      fechaFin: datos.fechaFin ?? null,
      googleEventId: datos.googleEventId ?? null,
    }));
    setClases((prev) => [...prev, ...nuevas]);
  }

  // Los campos de la clase (horario, salón, rango, evento) se aplican a todos sus días;
  // `dia` mueve solo esta ocurrencia.
  async function editar(id: string, datos: Partial<ClaseHorario>) {
    const actual = clases.find((c) => c.id === id);
    if (!actual) return;
    const claseId = actual.claseId;

    const patch: Record<string, unknown> = {};
    if (datos.materiaId !== undefined) patch.materia_id = datos.materiaId;
    if (datos.horaInicio !== undefined) patch.hora_inicio = datos.horaInicio;
    if (datos.horaFin !== undefined) patch.hora_fin = datos.horaFin;
    if (datos.salon !== undefined) patch.salon = datos.salon ?? null;
    if (datos.fechaInicio !== undefined) patch.fecha_inicio = datos.fechaInicio ?? null;
    if (datos.fechaFin !== undefined) patch.fecha_fin = datos.fechaFin ?? null;
    if (datos.googleEventId !== undefined) patch.google_event_id = datos.googleEventId ?? null;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("clases").update(patch).eq("id", claseId);
      if (error) return;
    }

    let nuevoDia = actual.dia;
    if (datos.dia !== undefined && datos.dia !== actual.dia) {
      const { error } = await supabase
        .from("clase_dias")
        .update({ dia: datos.dia })
        .eq("clase_id", claseId)
        .eq("dia", actual.dia);
      if (!error) nuevoDia = datos.dia;
    }

    setClases((prev) =>
      prev.map((c) => {
        if (c.claseId !== claseId) return c;
        const compartido = { ...c, ...datos, claseId: c.claseId, dia: c.dia };
        if (c.id !== id) return { ...compartido, id: c.id };
        return { ...compartido, dia: nuevoDia, id: idOcurrencia(claseId, nuevoDia) };
      })
    );
  }

  // Quita esta ocurrencia; si era el último día, elimina también la clase.
  async function eliminar(id: string) {
    const actual = clases.find((c) => c.id === id);
    if (!actual) return;
    const { claseId, dia } = actual;
    const quedan = clases.filter((c) => c.claseId === claseId && c.id !== id).length;

    const { error } = quedan > 0
      ? await supabase.from("clase_dias").delete().eq("clase_id", claseId).eq("dia", dia)
      : await supabase.from("clases").delete().eq("id", claseId);
    if (!error) setClases((prev) => prev.filter((c) => c.id !== id));
  }

  return { cargando, clases, agregar, editar, eliminar };
}
