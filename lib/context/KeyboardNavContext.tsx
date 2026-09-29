"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface HotkeyTarget {
  label: string;
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

function esAlt(key: string): boolean {
  return key === "Alt" || key === "AltGraph";
}

/**
 * Traduce el codigo fisico de tecla (independiente de layout y de
 * combinaciones raras como Option+letra en macOS, que produce
 * caracteres acentuados en `key`) a la letra/digito que usamos como
 * identificador del atajo.
 */
function codigoALetra(code: string): string | null {
  if (code.startsWith("Key") && code.length === 4) return code.slice(3);
  if (code.startsWith("Digit") && code.length === 6) return code.slice(5);
  return null;
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
        .map(([id, target]) => ({ id, target, nodo: target.getNode() }))
        .filter((e): e is { id: string; target: HotkeyTarget; nodo: HTMLElement } => !!e.nodo)
        // Orden visual real (arriba-abajo, izquierda-derecha) en vez de
        // depender del orden de montaje de los componentes.
        .sort((a, b) => {
          const pos = a.nodo.compareDocumentPosition(b.nodo);
          if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
          if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
          return 0;
        });

      for (const { id, target } of entradas) {
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
      if (esAlt(e.key) && !e.repeat) {
        if (esCampoDeTexto(document.activeElement)) return;
        setAsignaciones(calcularAsignaciones());
        setActivo(true);
        return;
      }
      if ((e.altKey || esAlt(e.key)) && activoRef.current && !e.ctrlKey && !e.metaKey) {
        const letra = codigoALetra(e.code);
        if (!letra) return;
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
      if (esAlt(e.key)) ocultar();
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
            className="absolute flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-md bg-slate-900 text-white text-xs font-bold leading-none tracking-wide ring-2 ring-white shadow-[0_2px_5px_rgba(0,0,0,0.45)]"
            style={{ top: rect.top - 10, left: rect.left - 10 }}
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
