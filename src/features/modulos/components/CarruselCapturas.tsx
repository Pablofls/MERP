"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import PantallaPreview, { ALTO_PANTALLA, ANCHO_PANTALLA } from "./PantallaPreview";

export interface Captura {
  titulo: string;
  contenido: React.ReactNode;
}

const ESCALA_MINI = 0.6;
const PASO = ANCHO_PANTALLA * ESCALA_MINI + 16; // ancho de una captura + separación

function Flecha({ dir, onClick, disabled, className }: { dir: "izq" | "der"; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "izq" ? "Anterior" : "Siguiente"}
      className={cn(
        "w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-0 transition-all",
        className,
      )}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "izq" ? "M15.75 19.5 8.25 12l7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"} />
      </svg>
    </button>
  );
}

/** Carrusel de capturas estilo tienda de apps; al tocar una se amplía. */
export default function CarruselCapturas({ capturas }: { capturas: Captura[] }) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = useState({ inicio: true, fin: true });
  const [abierta, setAbierta] = useState<number | null>(null);
  const [escalaGrande, setEscalaGrande] = useState(0.8);

  const medir = useCallback(() => {
    const el = pistaRef.current;
    if (!el) return;
    setBordes({ inicio: el.scrollLeft <= 4, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir]);

  // Escala de la captura ampliada: cabe en la ventana y en el modal (max-w-lg) con sus flechas
  useEffect(() => {
    if (abierta === null) return;
    const calcular = () => {
      const porAlto = (window.innerHeight - 200) / ALTO_PANTALLA;
      const porAncho = (Math.min(window.innerWidth, 512) - 40 - 88) / ANCHO_PANTALLA;
      setEscalaGrande(Math.max(0.4, Math.min(1, porAlto, porAncho)));
    };
    calcular();
    window.addEventListener("resize", calcular);
    return () => window.removeEventListener("resize", calcular);
  }, [abierta]);

  // Flechas del teclado dentro de la captura ampliada
  useEffect(() => {
    if (abierta === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setAbierta((i) => (i === null ? i : Math.max(0, i - 1)));
      if (e.key === "ArrowRight") setAbierta((i) => (i === null ? i : Math.min(capturas.length - 1, i + 1)));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [abierta, capturas.length]);

  const actual = abierta === null ? null : capturas[abierta];

  return (
    <div className="relative">
      <div
        ref={pistaRef}
        onScroll={medir}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:thin]"
      >
        {capturas.map((c, i) => (
          <figure key={c.titulo} className="snap-start flex-shrink-0">
            <button
              type="button"
              onClick={() => setAbierta(i)}
              aria-label={`Ampliar: ${c.titulo}`}
              className="block rounded-[22px] hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900"
            >
              <PantallaPreview escala={ESCALA_MINI}>{c.contenido}</PantallaPreview>
            </button>
            <figcaption className="text-xs text-gray-500 mt-2 text-center">{c.titulo}</figcaption>
          </figure>
        ))}
      </div>

      <Flecha
        dir="izq"
        onClick={() => pistaRef.current?.scrollBy({ left: -PASO, behavior: "smooth" })}
        disabled={bordes.inicio}
        className="hidden sm:flex absolute -left-4 top-[40%] -translate-y-1/2"
      />
      <Flecha
        dir="der"
        onClick={() => pistaRef.current?.scrollBy({ left: PASO, behavior: "smooth" })}
        disabled={bordes.fin}
        className="hidden sm:flex absolute -right-4 top-[40%] -translate-y-1/2"
      />

      <Modal open={actual !== null} onClose={() => setAbierta(null)} title={actual?.titulo ?? ""}>
        {actual && abierta !== null && (
          <>
            <div className="flex items-center justify-center gap-3">
              <Flecha dir="izq" onClick={() => setAbierta(abierta - 1)} disabled={abierta === 0} />
              <PantallaPreview escala={escalaGrande}>{actual.contenido}</PantallaPreview>
              <Flecha dir="der" onClick={() => setAbierta(abierta + 1)} disabled={abierta === capturas.length - 1} />
            </div>
            <p className="text-center text-xs text-gray-400 mt-3 tabular-nums">
              {abierta + 1} / {capturas.length}
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}
