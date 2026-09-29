"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface HotkeyTarget {
  label: string;
  order: number;
  getNode: () => HTMLElement | null;
}

interface KeyboardNavContextValue {
  register: (id: string, target: HotkeyTarget) => void;
  unregister: (id: string) => void;
}

const KeyboardNavContext = createContext<KeyboardNavContextValue | null>(null);

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

function letrasCandidatas(label: string): string[] {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .split("");
}

function esCampoDeTexto(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return (el as HTMLElement).isContentEditable;
}

export function KeyboardNavProvider({ children }: { children: React.ReactNode }) {
  const registro = useRef(new Map<string, HotkeyTarget>());
  const [activo, setActivo] = useState(false);
  const [asignaciones, setAsignaciones] = useState<Map<string, string>>(new Map());
  const activoRef = useRef(false);
  const asignacionesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    activoRef.current = activo;
  }, [activo]);
  useEffect(() => {
    asignacionesRef.current = asignaciones;
  }, [asignaciones]);

  const value = useMemo<KeyboardNavContextValue>(
    () => ({
      register: (id, target) => registro.current.set(id, target),
      unregister: (id) => registro.current.delete(id),
    }),
    []
  );

  useEffect(() => {
    function calcularAsignaciones(): Map<string, string> {
      const usados = new Set<string>();
      const mapa = new Map<string, string>();
      const entradas = Array.from(registro.current.entries())
        .filter(([, t]) => !!t.getNode())
        .sort((a, b) => a[1].order - b[1].order);

      for (const [id, target] of entradas) {
        const candidatos = [...letrasCandidatas(target.label), ...ALFABETO];
        const letra = candidatos.find((c) => !usados.has(c));
        if (letra) {
          usados.add(letra);
          mapa.set(id, letra);
        }
      }
      return mapa;
    }

    function ocultar() {
      setActivo(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Alt" && !e.repeat) {
        if (esCampoDeTexto(document.activeElement)) return;
        setAsignaciones(calcularAsignaciones());
        setActivo(true);
        return;
      }
      if (e.altKey && activoRef.current && !e.ctrlKey && !e.metaKey) {
        if (e.key.length !== 1) return;
        const letra = e.key.toUpperCase();
        for (const [id, l] of asignacionesRef.current) {
          if (l === letra) {
            e.preventDefault();
            registro.current.get(id)?.getNode()?.click();
            ocultar();
            break;
          }
        }
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Alt") ocultar();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", ocultar);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", ocultar);
    };
  }, []);

  return (
    <KeyboardNavContext.Provider value={value}>
      {children}
      {activo && <HotkeyHints asignaciones={asignaciones} registro={registro.current} />}
    </KeyboardNavContext.Provider>
  );
}

function HotkeyHints({
  asignaciones,
  registro,
}: {
  asignaciones: Map<string, string>;
  registro: Map<string, HotkeyTarget>;
}) {
  const [, forzar] = useState(0);

  useEffect(() => {
    const handler = () => forzar((n) => n + 1);
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] pointer-events-none">
      {Array.from(asignaciones.entries()).map(([id, letra]) => {
        const nodo = registro.get(id)?.getNode();
        if (!nodo) return null;
        const rect = nodo.getBoundingClientRect();
        return (
          <span
            key={id}
            className="absolute flex items-center justify-center w-5 h-5 rounded bg-blue-900 text-white text-[11px] font-bold shadow-md border border-white"
            style={{ top: rect.top - 8, left: rect.left - 8 }}
          >
            {letra}
          </span>
        );
      })}
    </div>,
    document.body
  );
}

export function useKeyboardNav(): KeyboardNavContextValue {
  const ctx = useContext(KeyboardNavContext);
  if (!ctx) throw new Error("useKeyboardNav debe usarse dentro de KeyboardNavProvider");
  return ctx;
}
