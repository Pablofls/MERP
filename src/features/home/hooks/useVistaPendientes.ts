"use client";
import { useState } from "react";

export type VistaPendientes = "timeline" | "lista";

export function useVistaPendientes(vista: string): [VistaPendientes, () => void] {
  const key = `vistaPendientes_${vista}`;
  const [modo, setModo] = useState<VistaPendientes>(() => {
    if (typeof window === "undefined") return "timeline";
    return (localStorage.getItem(key) as VistaPendientes) ?? "timeline";
  });

  function toggleVista() {
    setModo((prev) => {
      const next = prev === "timeline" ? "lista" : "timeline";
      localStorage.setItem(key, next);
      return next;
    });
  }

  return [modo, toggleVista];
}
