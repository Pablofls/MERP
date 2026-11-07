// Generador de outfits al azar. Reglas de los tops por capas:
//  - capa 1: camisas y camisetas (la base)
//  - capa 2: suéteres y sudaderas, o una chamarra actuando como capa 2
//  - capa 3: chamarra encima de un suéter (solo si la capa 2 es un suéter)
// Bottom siempre; calzado siempre que haya; gorra y accesorio a veces.
import type { Prenda } from "@/lib/types";
import { categoria } from "./catalogo";

export type Ranura = "gorra" | "capa1" | "capa2" | "capa3" | "bottom" | "calzado" | "accesorio";
export type Outfit = Partial<Record<Ranura, Prenda>>;

export const RANURAS: Ranura[] = ["gorra", "capa3", "capa2", "capa1", "bottom", "calzado", "accesorio"];

const P_CAPA2 = 0.5; // agregar suéter o chamarra sobre la base
const P_CAPA3 = 0.4; // agregar chamarra sobre el suéter
const P_SUETER_BAJO_CHAMARRA = 0.5; // con una chamarra fija, ponerle un suéter debajo
const P_EXTRA = 0.35; // gorra y accesorio
const INTENTOS_DISTINTO = 8;

type Pools = Record<"gorras" | "camisas" | "sueteres" | "chamarras" | "bottoms" | "calzado" | "accesorios", Prenda[]>;

function agrupar(prendas: Prenda[]): Pools {
  const p: Pools = { gorras: [], camisas: [], sueteres: [], chamarras: [], bottoms: [], calzado: [], accesorios: [] };
  for (const x of prendas) {
    const c = categoria(x.categoria);
    if (!c) continue;
    if (c.grupo === "tops") {
      if (c.capa === 1) p.camisas.push(x);
      else if (c.capa === 2) p.sueteres.push(x);
      else p.chamarras.push(x);
    } else if (c.grupo === "gorras") p.gorras.push(x);
    else if (c.grupo === "bottoms") p.bottoms.push(x);
    else if (c.grupo === "calzado") p.calzado.push(x);
    else p.accesorios.push(x);
  }
  return p;
}

/** Qué falta para poder generar un outfit (vacío = se puede). */
export function faltantesOutfit(prendas: Prenda[]): string[] {
  const p = agrupar(prendas);
  const faltan: string[] = [];
  if (p.camisas.length + p.sueteres.length + p.chamarras.length === 0) faltan.push("un top");
  if (p.bottoms.length === 0) faltan.push("un bottom");
  return faltan;
}

/** Huella del outfit para no repetir el mismo al regenerar. */
export function firmaOutfit(o: Outfit): string {
  return RANURAS.map((r) => o[r]?.id ?? "-").join("|");
}

/**
 * Arma un outfit al azar. Las prendas `fijas` (candado) se conservan y se acomodan en su capa; el resto se
 * sortea respetando las reglas. Si hay alternativas, evita repetir exactamente `previo`.
 */
export function generarOutfit(
  prendas: Prenda[],
  { fijas = [], previo, azar = Math.random }: { fijas?: Prenda[]; previo?: Outfit; azar?: () => number } = {},
): Outfit {
  const p = agrupar(prendas);
  if (faltantesOutfit(prendas).length) return {};

  const elegir = <T,>(xs: T[]): T | undefined => (xs.length ? xs[Math.floor(azar() * xs.length)] : undefined);
  const fija = (pool: Prenda[]) => fijas.find((f) => pool.some((x) => x.id === f.id));

  const sortear = (): Outfit => {
    const o: Outfit = {};
    const extra = (pool: Prenda[]) => fija(pool) ?? (azar() < P_EXTRA ? elegir(pool) : undefined);

    o.gorra = extra(p.gorras);
    o.accesorio = extra(p.accesorios);
    o.bottom = fija(p.bottoms) ?? elegir(p.bottoms);
    o.calzado = fija(p.calzado) ?? elegir(p.calzado);

    // Tops por capas
    o.capa1 = fija(p.camisas) ?? elegir(p.camisas);
    const sueterFijo = fija(p.sueteres);
    const chamarraFija = fija(p.chamarras);
    const esSueter = (x?: Prenda) => !!x && p.sueteres.some((s) => s.id === x.id);

    if (sueterFijo) {
      o.capa2 = sueterFijo;
      o.capa3 = chamarraFija ?? (azar() < P_CAPA3 ? elegir(p.chamarras) : undefined);
    } else if (chamarraFija) {
      // La chamarra fija va sobre un suéter (capa 3) o directo sobre la base (actúa como capa 2)
      const sueter = azar() < P_SUETER_BAJO_CHAMARRA ? elegir(p.sueteres) : undefined;
      if (sueter) {
        o.capa2 = sueter;
        o.capa3 = chamarraFija;
      } else {
        o.capa2 = chamarraFija;
      }
    } else if (!o.capa1 || azar() < P_CAPA2) {
      // Sin camisas, un suéter o chamarra hace de base
      o.capa2 = elegir([...p.sueteres, ...p.chamarras]);
      if (esSueter(o.capa2) && azar() < P_CAPA3) o.capa3 = elegir(p.chamarras);
    }

    for (const r of RANURAS) if (!o[r]) delete o[r];
    return o;
  };

  const anterior = previo ? firmaOutfit(previo) : null;
  let o = sortear();
  for (let i = 0; i < INTENTOS_DISTINTO && anterior !== null && firmaOutfit(o) === anterior; i++) o = sortear();
  return o;
}
