"use client";
import { useState } from "react";
import { MATERIAS_MOCK } from "../mock-data";
import type { Materia } from "../types";

export function useMaterias() {
  const [materias, setMaterias] = useState<Materia[]>(MATERIAS_MOCK);

  function agregar(datos: Omit<Materia, "id">) {
    const nueva: Materia = { ...datos, id: `m-${Date.now()}` };
    setMaterias((prev) => [...prev, nueva]);
  }

  function editar(id: string, datos: Partial<Materia>) {
    setMaterias((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...datos } : m))
    );
  }

  function eliminar(id: string) {
    setMaterias((prev) => prev.filter((m) => m.id !== id));
  }

  return { materias, agregar, editar, eliminar };
}
