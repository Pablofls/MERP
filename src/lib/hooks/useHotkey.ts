"use client";
import { useCallback, useEffect, useId, useRef } from "react";
import { useKeyboardNav } from "@/lib/context/KeyboardNavContext";

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
  const disabled = opciones?.disabled ?? false;

  useEffect(() => {
    if (disabled) return;
    register(id, {
      label,
      getNode: () => nodoRef.current,
    });
    return () => unregister(id);
  }, [id, label, disabled, register, unregister]);

  return useCallback((node: T | null) => {
    nodoRef.current = node;
  }, []);
}
