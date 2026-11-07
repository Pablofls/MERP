"use client";
import { useEffect, useMemo, useState } from "react";
import type { Prenda } from "@/lib/types";
import { RANURAS, faltantesOutfit, generarOutfit, type Outfit } from "../lib/generarOutfit";
import LienzoOutfit from "./LienzoOutfit";

/** Outfit al azar con candados: lo fijado se conserva y el resto se vuelve a sortear. Nada se guarda. */
export default function GeneradorOutfit({ prendas }: { prendas: Prenda[] }) {
  const [outfit, setOutfit] = useState<Outfit>({});
  const [fijas, setFijas] = useState<Set<string>>(() => new Set());

  const faltan = faltantesOutfit(prendas);
  const puede = faltan.length === 0;

  // Quita del outfit las prendas que ya no existen y usa su versión más reciente
  const vigente = useMemo(() => {
    const porId = new Map(prendas.map((p) => [p.id, p]));
    const o: Outfit = {};
    for (const r of RANURAS) {
      const actual = outfit[r] && porId.get(outfit[r]!.id);
      if (actual) o[r] = actual;
    }
    return o;
  }, [outfit, prendas]);
  const vacio = RANURAS.every((r) => !vigente[r]);

  // El primero se genera solo en cuanto hay prendas suficientes
  useEffect(() => {
    if (vacio && puede) setOutfit(generarOutfit(prendas));
  }, [vacio, puede, prendas]);

  function generar() {
    const conCandado = RANURAS.map((r) => vigente[r]).filter((p): p is Prenda => !!p && fijas.has(p.id));
    setOutfit(generarOutfit(prendas, { fijas: conCandado, previo: vigente }));
  }

  function alternarFija(p: Prenda) {
    setFijas((prev) => {
      const sig = new Set(prev);
      if (sig.has(p.id)) sig.delete(p.id);
      else sig.add(p.id);
      return sig;
    });
  }

  return (
    <div className="space-y-3">
      {puede ? (
        <LienzoOutfit outfit={vigente} fijas={fijas} onAlternarFija={alternarFija} />
      ) : (
        <div className="w-full aspect-[3/4] rounded-2xl bg-stone-100 flex flex-col items-center justify-center text-center px-8">
          <IconoShuffle className="w-8 h-8 text-stone-300 mb-3" />
          <p className="text-sm font-medium text-gray-600">Aún no se puede armar un outfit</p>
          <p className="text-xs text-gray-400 mt-1">Agrega al menos {faltan.join(" y ")} a tu closet.</p>
        </div>
      )}
      <button
        type="button"
        onClick={generar}
        disabled={!puede}
        className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white text-sm font-semibold py-3 rounded-full hover:bg-blue-800 active:scale-[0.99] disabled:opacity-40 transition-all"
      >
        <IconoShuffle className="w-4 h-4" />
        Generar outfit
      </button>
      {puede && (
        <p className="text-[11px] text-gray-400 text-center">
          Toca el candado de una prenda para conservarla al generar otro.
        </p>
      )}
    </div>
  );
}

export function IconoShuffle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}
