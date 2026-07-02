"use client";
import { useState } from "react";
import { PENDIENTES_MOCK } from "../mock-data";
import type { Pendiente } from "../types";

export function usePendientes() {
  const [pendientes, setPendientes] = useState<Pendiente[]>(PENDIENTES_MOCK);

  function agregar(datos: Omit<Pendiente, "id" | "completado">) {
    const nuevo: Pendiente = {
      ...datos,
      id: `p-${Date.now()}`,
      completado: false,
    };
    setPendientes((prev) => [nuevo, ...prev]);
  }

  function toggleCompletado(id: string) {
    setPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completado: !p.completado } : p))
    );
  }

  function eliminar(id: string) {
    setPendientes((prev) => prev.filter((p) => p.id !== id));
  }

  function editar(id: string, datos: Partial<Pendiente>) {
    setPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...datos } : p))
    );
  }

  return { pendientes, agregar, toggleCompletado, eliminar, editar };
}
