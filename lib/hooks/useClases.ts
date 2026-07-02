"use client";
import { useState } from "react";
import { CLASES_MOCK } from "../mock-data";
import type { ClaseHorario } from "../types";

export function useClases() {
  const [clases, setClases] = useState<ClaseHorario[]>(CLASES_MOCK);

  function agregar(datos: Omit<ClaseHorario, "id">) {
    const nueva: ClaseHorario = { ...datos, id: `c-${Date.now()}` };
    setClases((prev) => [...prev, nueva]);
  }

  function editar(id: string, datos: Partial<ClaseHorario>) {
    setClases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...datos } : c))
    );
  }

  function eliminar(id: string) {
    setClases((prev) => prev.filter((c) => c.id !== id));
  }

  return { clases, agregar, editar, eliminar };
}
