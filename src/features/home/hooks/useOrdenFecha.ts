"use client";
import { useState } from "react";

export type OrdenFecha = "desc" | "asc";

export function useOrdenFecha(vista: string): [OrdenFecha, () => void] {
  const key = `ordenFecha_${vista}`;
  const [orden, setOrden] = useState<OrdenFecha>(() => {
    if (typeof window === "undefined") return "desc";
    return (localStorage.getItem(key) as OrdenFecha) ?? "desc";
  });

  function toggleOrden() {
    setOrden((prev) => {
      const next = prev === "desc" ? "asc" : "desc";
      localStorage.setItem(key, next);
      return next;
    });
  }

  return [orden, toggleOrden];
}
