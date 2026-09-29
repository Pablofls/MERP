"use client";
import { useEffect, useId, useRef } from "react";
import { useKeyboardNav } from "@/lib/context/KeyboardNavContext";

let contadorOrden = 0;

/**
 * Registra un atajo de teclado estilo Odoo: al mantener Alt presionado
 * aparece una letra sobre el elemento; al soltar esa letra (con Alt
 * presionado) se simula un click sobre el nodo referenciado.
 */
export function useHotkey<T extends HTMLElement = HTMLElement>(
  label: string,
  opciones?: { disabled?: boolean }
) {
  const { register, unregister } = useKeyboardNav();
  const id = useId();
  const nodoRef = useRef<T | null>(null);
  const ordenRef = useRef<number | null>(null);
  if (ordenRef.current === null) ordenRef.current = contadorOrden++;
  const disabled = opciones?.disabled ?? false;

  useEffect(() => {
    if (disabled) return;
    register(id, {
      label,
      order: ordenRef.current!,
      getNode: () => nodoRef.current,
    });
    return () => unregister(id);
  }, [id, label, disabled, register, unregister]);

  return (node: T | null) => {
    nodoRef.current = node;
  };
}
