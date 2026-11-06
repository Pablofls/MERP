"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import PantallaPreview, { ALTO_PANTALLA, ANCHO_PANTALLA } from "./PantallaPreview";

export interface Captura {
  titulo: string;
  ruta: string; // ruta que se muestra en la barra del navegador y en el menú
  contenido: React.ReactNode;
}

const GAP = 16;
const ESCALA_MINI_MAX = 0.45;
const ESCALA_MINI_MIN = 0.2;

function Flecha({ dir, onClick, disabled, className }: { dir: "izq" | "der"; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "izq" ? "Anterior" : "Siguiente"}
      className={cn(
        "w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-0 transition-all flex-shrink-0",
        className,
      )}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "izq" ? "M15.75 19.5 8.25 12l7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"} />
      </svg>
    </button>
  );
}

/** Carrusel de capturas de escritorio estilo tienda de apps; al tocar una se amplía. */
export default function CarruselCapturas({ capturas }: { capturas: Captura[] }) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const [escalaMini, setEscalaMini] = useState(ESCALA_MINI_MAX);
  const [bordes, setBordes] = useState({ inicio: true, fin: true });
  const [abierta, setAbierta] = useState<number | null>(null);
  const [escalaGrande, setEscalaGrande] = useState(0.8);

  const medir = useCallback(() => {
    const el = pistaRef.current;
    if (!el) return;
    setBordes({ inicio: el.scrollLeft <= 4, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  // La miniatura ocupa ~85% del ancho disponible (asoma la siguiente), con tope en escritorio
  useEffect(() => {
    const el = pistaRef.current;
    if (!el) return;
    const ajustar = () => {
      const escala = (el.clientWidth * 0.85) / ANCHO_PANTALLA;
      setEscalaMini(Math.max(ESCALA_MINI_MIN, Math.min(ESCALA_MINI_MAX, escala)));
      medir();
    };
    ajustar();
    const observer = new ResizeObserver(ajustar);
    observer.observe(el);
    return () => observer.disconnect();
  }, [medir]);

  // Visor ampliado: escala para caber en la ventana; Esc cierra y las flechas navegan
  useEffect(() => {
    if (abierta === null) return;
    const calcular = () => {
      const porAncho = (window.innerWidth - 140) / ANCHO_PANTALLA;
      const porAlto = (window.innerHeight - 120) / ALTO_PANTALLA;
      setEscalaGrande(Math.max(0.2, Math.min(1, porAncho, porAlto)));
    };
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(null);
      if (e.key === "ArrowLeft") setAbierta((i) => (i === null ? i : Math.max(0, i - 1)));
      if (e.key === "ArrowRight") setAbierta((i) => (i === null ? i : Math.min(capturas.length - 1, i + 1)));
    };
    calcular();
    window.addEventListener("resize", calcular);
    document.addEventListener("keydown", teclas);
    return () => {
      window.removeEventListener("resize", calcular);
      document.removeEventListener("keydown", teclas);
    };
  }, [abierta, capturas.length]);

  const paso = ANCHO_PANTALLA * escalaMini + GAP;
  const actual = abierta === null ? null : capturas[abierta];

  return (
    <div className="relative">
      <div
        ref={pistaRef}
        onScroll={medir}
        className="flex overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:thin]"
        style={{ gap: GAP }}
      >
        {capturas.map((c, i) => (
          <figure key={c.titulo} className="snap-start flex-shrink-0">
            <button
              type="button"
              onClick={() => setAbierta(i)}
              aria-label={`Ampliar: ${c.titulo}`}
              className="block rounded-xl hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900"
            >
              <PantallaPreview escala={escalaMini} ruta={c.ruta}>{c.contenido}</PantallaPreview>
            </button>
            <figcaption className="text-xs text-gray-500 mt-2 text-center">{c.titulo}</figcaption>
          </figure>
        ))}
      </div>

      <Flecha
        dir="izq"
        onClick={() => pistaRef.current?.scrollBy({ left: -paso, behavior: "smooth" })}
        disabled={bordes.inicio}
        className="hidden sm:flex absolute -left-4 top-[45%] -translate-y-1/2"
      />
      <Flecha
        dir="der"
        onClick={() => pistaRef.current?.scrollBy({ left: paso, behavior: "smooth" })}
        disabled={bordes.fin}
        className="hidden sm:flex absolute -right-4 top-[45%] -translate-y-1/2"
      />

      {/* Visor ampliado */}
      {actual && abierta !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={actual.titulo}
          className="fixed inset-0 z-50 bg-black/75 flex flex-col items-center justify-center p-4"
          onClick={() => setAbierta(null)}
        >
          <button
            type="button"
            onClick={() => setAbierta(null)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <Flecha dir="izq" onClick={() => setAbierta(abierta - 1)} disabled={abierta === 0} />
            <PantallaPreview escala={escalaGrande} ruta={actual.ruta}>{actual.contenido}</PantallaPreview>
            <Flecha dir="der" onClick={() => setAbierta(abierta + 1)} disabled={abierta === capturas.length - 1} />
          </div>
          <p className="text-sm text-white/80 mt-4" onClick={(e) => e.stopPropagation()}>
            {actual.titulo} <span className="text-white/50 tabular-nums">· {abierta + 1} / {capturas.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}
