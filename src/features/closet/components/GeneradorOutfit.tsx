"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useHotkey } from "@/lib/hooks/useHotkey";
import type { Prenda } from "@/lib/types";
import { categoria } from "../lib/catalogo";
import { NOMBRE_RANURA, RANURAS_PANEL, opcionesRanura, type Outfit, type Ranura } from "../lib/generarOutfit";
import type { EstadoOutfit } from "../hooks/useOutfit";
import LienzoOutfit from "./LienzoOutfit";
import ImagenPrenda from "./ImagenPrenda";

/**
 * Estudio del outfit: el collage y, junto a él, una fila por prenda para cambiarla con las flechas y fijarla con
 * el candado. "Generar outfit" sortea de nuevo todo lo que no tenga candado.
 */
export default function GeneradorOutfit({ prendas, estado }: { prendas: Prenda[]; estado: EstadoOutfit }) {
  const [resaltada, setResaltada] = useState<Ranura | null>(null);
  const { outfit, fijas, faltan, puede, generar, alternarFija, mover } = estado;
  const generarRef = useHotkey<HTMLButtonElement>("Generar", { disabled: !puede });

  if (!puede) {
    return (
      <div className="w-full aspect-[3/4] max-w-sm mx-auto rounded-2xl bg-stone-100 flex flex-col items-center justify-center text-center px-8">
        <IconoShuffle className="w-8 h-8 text-stone-300 mb-3" />
        <p className="text-sm font-medium text-gray-600">Aún no se puede armar un outfit</p>
        <p className="text-xs text-gray-400 mt-1">Agrega al menos {faltan.join(" y ")} a tu closet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_280px] items-start">
      <div className="space-y-3">
        <LienzoOutfit outfit={outfit} resaltada={resaltada} />
        <button
          ref={generarRef}
          type="button"
          onClick={generar}
          className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white text-sm font-semibold py-3 rounded-full hover:bg-blue-800 active:scale-[0.99] transition-all"
        >
          <IconoShuffle className="w-4 h-4" />
          Generar outfit
        </button>
      </div>
      <div className="space-y-3">
        <PanelRanuras
          prendas={prendas}
          outfit={outfit}
          fijas={fijas}
          onMover={mover}
          onAlternarFija={alternarFija}
          onResaltar={setResaltada}
        />
        <p className="text-[11px] text-gray-400 text-center leading-snug">
          Usa las flechas para elegir cada prenda. Lo que tenga candado se conserva al generar otro.
        </p>
      </div>
    </div>
  );
}

interface PropsPanel {
  prendas: Prenda[];
  outfit: Outfit;
  fijas: Set<string>;
  onMover: (r: Ranura, paso: number) => void;
  onAlternarFija: (p: Prenda) => void;
  onResaltar?: (r: Ranura | null) => void;
}

/** Una fila por ranura con prendas disponibles: ◀ prenda ▶ y candado. */
export function PanelRanuras({ prendas, outfit, fijas, onMover, onAlternarFija, onResaltar }: PropsPanel) {
  const filas = RANURAS_PANEL.map((r) => ({ r, ops: opcionesRanura(prendas, r, outfit) })).filter(
    ({ r, ops }) => ops.some(Boolean) || outfit[r],
  );

  return (
    <div className="rounded-2xl bg-white border border-gray-200/70 p-1.5 space-y-0.5" onMouseLeave={() => onResaltar?.(null)}>
      {filas.map(({ r, ops }) => {
        const prenda = outfit[r];
        const i = Math.max(0, ops.findIndex((x) => x?.id === prenda?.id));
        const total = ops.filter(Boolean).length;
        const fija = !!prenda && fijas.has(prenda.id);
        const nombre = prenda ? prenda.nombre || categoria(prenda.categoria)?.nombre : "Ninguna";
        return (
          <div
            key={r}
            onMouseEnter={() => onResaltar?.(prenda ? r : null)}
            className={cn("flex items-center gap-1 rounded-xl p-1 transition-colors hover:bg-stone-50", fija && "bg-blue-50/60 hover:bg-blue-50")}
          >
            <Flecha dir={-1} disabled={ops.length < 2} onClick={() => onMover(r, -1)} etiqueta={`${NOMBRE_RANURA[r]}: anterior`} />
            <div className="flex-1 min-w-0 flex items-center gap-2.5">
              <div
                className={cn(
                  "w-12 h-12 shrink-0 rounded-lg flex items-center justify-center",
                  prenda ? "bg-stone-100 p-1" : "border border-dashed border-gray-300",
                )}
              >
                {prenda && <ImagenPrenda prenda={prenda} className="w-full h-full drop-shadow-sm" />}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 truncate">
                  {NOMBRE_RANURA[r]}
                  {prenda && total > 1 && <span className="ml-1 font-normal normal-case tracking-normal text-gray-300">{`${ops[0] ? i + 1 : i}/${total}`}</span>}
                </p>
                <p className={cn("text-sm truncate", prenda ? "text-gray-800" : "text-gray-400")}>{nombre}</p>
              </div>
            </div>
            <Flecha dir={1} disabled={ops.length < 2} onClick={() => onMover(r, 1)} etiqueta={`${NOMBRE_RANURA[r]}: siguiente`} />
            <Candado fija={fija} disabled={!prenda} onClick={() => prenda && onAlternarFija(prenda)} />
          </div>
        );
      })}
    </div>
  );
}

function Flecha({ dir, disabled, onClick, etiqueta }: { dir: -1 | 1; disabled: boolean; onClick: () => void; etiqueta: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      className="w-7 h-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={dir < 0 ? "M15.75 19.5 8.25 12l7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"} />
      </svg>
    </button>
  );
}

function Candado({ fija, disabled, onClick }: { fija: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={fija}
      aria-label={fija ? "Quitar candado" : "Fijar prenda"}
      title={fija ? "Quitar candado" : "Fijar: se conserva al generar otro"}
      className={cn(
        "w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-colors disabled:opacity-0",
        fija ? "bg-blue-900 text-white" : "text-gray-400 hover:text-gray-900 hover:bg-stone-100",
      )}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {fija ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        )}
      </svg>
    </button>
  );
}

export function IconoShuffle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}
