"use client";
import { useState } from "react";
import { HABITOS_MOCK, REGISTROS_MOCK } from "../mock-data";
import type { Habito, RegistroHabito } from "../types";

export function useHabitos() {
  const [habitos, setHabitos] = useState<Habito[]>(HABITOS_MOCK);
  const [registros, setRegistros] = useState<RegistroHabito[]>(REGISTROS_MOCK);

  function agregarHabito(datos: Omit<Habito, "id" | "activo">) {
    const nuevo: Habito = { ...datos, id: `h-${Date.now()}`, activo: true };
    setHabitos((prev) => [...prev, nuevo]);
  }

  function editarHabito(id: string, datos: Partial<Habito>) {
    setHabitos((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...datos } : h))
    );
  }

  function eliminarHabito(id: string) {
    setHabitos((prev) => prev.filter((h) => h.id !== id));
    setRegistros((prev) => prev.filter((r) => r.habitoId !== id));
  }

  function registrar(habitoId: string, fecha: string, valor: number) {
    const existing = registros.find(
      (r) => r.habitoId === habitoId && r.fecha === fecha
    );
    if (existing) {
      setRegistros((prev) =>
        prev.map((r) =>
          r.habitoId === habitoId && r.fecha === fecha ? { ...r, valor } : r
        )
      );
    } else {
      setRegistros((prev) => [
        ...prev,
        { id: `r-${Date.now()}`, habitoId, fecha, valor },
      ]);
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
    let racha = 0;
    let fecha = new Date(hoy);
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
