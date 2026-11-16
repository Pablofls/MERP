"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Prenda } from "@/lib/types";
import {
  RANURAS,
  alternarEnOutfit,
  faltantesOutfit,
  generarOutfit,
  moverRanura,
  type Outfit,
  type Ranura,
} from "../lib/generarOutfit";

/**
 * Estado del outfit en pantalla: se arma al azar (respetando los candados) o a mano, prenda por prenda.
 * Los candados son por prenda; al cambiar a mano una ranura con candado, el candado pasa a la nueva prenda.
 * Nada se guarda.
 */
export function useOutfit(prendas: Prenda[]) {
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

  const generar = useCallback(() => {
    const conCandado = RANURAS.map((r) => vigente[r]).filter((p): p is Prenda => !!p && fijas.has(p.id));
    setOutfit(generarOutfit(prendas, { fijas: conCandado, previo: vigente }));
  }, [prendas, vigente, fijas]);

  const alternarFija = useCallback((p: Prenda) => {
    setFijas((prev) => {
      const sig = new Set(prev);
      if (sig.has(p.id)) sig.delete(p.id);
      else sig.add(p.id);
      return sig;
    });
  }, []);

  const mover = useCallback(
    (ranura: Ranura, paso: number) => {
      const antes = vigente[ranura];
      const sig = moverRanura(prendas, vigente, ranura, paso);
      const nueva = sig[ranura];
      if (antes && fijas.has(antes.id) && nueva?.id !== antes.id) {
        setFijas((prev) => {
          const s = new Set(prev);
          s.delete(antes.id);
          if (nueva) s.add(nueva.id);
          return s;
        });
      }
      setOutfit(sig);
    },
    [prendas, vigente, fijas],
  );

  const alternarPrenda = useCallback((p: Prenda) => setOutfit(alternarEnOutfit(vigente, p)), [vigente]);

  return { outfit: vigente, fijas, faltan, puede, generar, alternarFija, mover, alternarPrenda };
}

export type EstadoOutfit = ReturnType<typeof useOutfit>;
