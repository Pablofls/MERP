// Copia del catálogo sembrado en supabase/migrations/20261107_closet.sql (closet_grupos, closet_categorias,
// closet_categorias_top). Es fijo y solo cambia con una migración; la BD lo usa para la integridad de
// closet_prendas.categoria_clave y la app para la interfaz y el generador de outfits.

export type ClaveGrupo = "gorras" | "tops" | "bottoms" | "calzado" | "accesorios";

export interface CategoriaPrenda {
  clave: string;
  grupo: ClaveGrupo;
  nombre: string;
  /** Solo tops: 1 camisas/camisetas, 2 suéteres/sudaderas, 3 chamarras (que también pueden ir como capa 2) */
  capa?: 1 | 2 | 3;
}

export interface GrupoPrenda {
  clave: ClaveGrupo;
  nombre: string;
  descripcion: string; // ayuda al elegir el grupo
}

export const GRUPOS: GrupoPrenda[] = [
  { clave: "gorras", nombre: "Gorras", descripcion: "Gorras, sombreros y gorros" },
  { clave: "tops", nombre: "Tops", descripcion: "Camisas, suéteres y chamarras" },
  { clave: "bottoms", nombre: "Bottoms", descripcion: "Shorts, pantalones y jeans" },
  { clave: "calzado", nombre: "Calzado", descripcion: "Tenis, zapatos, botas…" },
  { clave: "accesorios", nombre: "Accesorios", descripcion: "Bolsas, lentes, relojes…" },
];

export const CATEGORIAS: CategoriaPrenda[] = [
  { clave: "gorras", grupo: "gorras", nombre: "Gorras, sombreros y gorros" },
  { clave: "camisas", grupo: "tops", nombre: "Camisas y camisetas", capa: 1 },
  { clave: "sueteres", grupo: "tops", nombre: "Suéteres y sudaderas", capa: 2 },
  { clave: "chamarras", grupo: "tops", nombre: "Chamarras", capa: 3 },
  { clave: "shorts", grupo: "bottoms", nombre: "Shorts" },
  { clave: "pantalones", grupo: "bottoms", nombre: "Pantalones y jeans" },
  { clave: "calzado", grupo: "calzado", nombre: "Calzado" },
  { clave: "accesorios", grupo: "accesorios", nombre: "Accesorios" },
];

const POR_CLAVE = new Map(CATEGORIAS.map((c) => [c.clave, c]));

export function categoria(clave: string): CategoriaPrenda | undefined {
  return POR_CLAVE.get(clave);
}

export function grupoDe(claveCategoria: string): ClaveGrupo | undefined {
  return POR_CLAVE.get(claveCategoria)?.grupo;
}

export function categoriasDe(grupo: ClaveGrupo): CategoriaPrenda[] {
  return CATEGORIAS.filter((c) => c.grupo === grupo);
}

/** Etiqueta para elegir la categoría: en tops antepone la capa ("Capa 1 · Camisas y camisetas"). */
export function etiquetaCategoria(c: CategoriaPrenda): string {
  return c.capa ? `Capa ${c.capa} · ${c.nombre}` : c.nombre;
}

// ── Marcos de tamaño ──────────────────────────────────────────────────────────────────────────────
// Tamaño típico (cm) de cada categoría extendida sobre una superficie, con su silueta de guía. Al recortar, la
// prenda se encaja en su marco: así todas quedan a la misma escala en el outfit. Copia en el backfill de
// supabase/migrations/20261108_closet_tamano.sql.

export interface MarcoCategoria {
  ancho: number; // cm
  alto: number; // cm
  /** Silueta de guía: polígono en coordenadas normalizadas (0–1) dentro del marco */
  silueta: [number, number][];
}

const CAMISETA: [number, number][] = [
  [0.36, 0], [0.2, 0.06], [0, 0.27], [0.12, 0.42], [0.21, 0.36], [0.21, 1], [0.79, 1], [0.79, 0.36],
  [0.88, 0.42], [1, 0.27], [0.8, 0.06], [0.64, 0], [0.57, 0.06], [0.5, 0.08], [0.43, 0.06],
];
const MANGA_LARGA: [number, number][] = [
  [0.35, 0.02], [0.18, 0.08], [0.05, 0.55], [0, 0.95], [0.12, 0.97], [0.21, 0.5], [0.22, 1], [0.78, 1],
  [0.79, 0.5], [0.88, 0.97], [1, 0.95], [0.95, 0.55], [0.82, 0.08], [0.65, 0.02], [0.58, 0.08], [0.5, 0.1], [0.42, 0.08],
];
const CHAMARRA: [number, number][] = [
  [0.35, 0], [0.18, 0.07], [0.05, 0.55], [0, 0.95], [0.12, 0.97], [0.21, 0.5], [0.22, 1], [0.78, 1],
  [0.79, 0.5], [0.88, 0.97], [1, 0.95], [0.95, 0.55], [0.82, 0.07], [0.65, 0], [0.5, 0.16],
];

export const MARCOS: Record<string, MarcoCategoria> = {
  gorras: {
    ancho: 26, alto: 18,
    silueta: [[0.02, 0.95], [0.05, 0.55], [0.18, 0.2], [0.35, 0.04], [0.5, 0], [0.65, 0.04], [0.82, 0.2], [0.95, 0.55], [0.98, 0.95], [0.8, 1], [0.2, 1]],
  },
  camisas: { ancho: 72, alto: 76, silueta: CAMISETA },
  sueteres: { ancho: 76, alto: 74, silueta: MANGA_LARGA },
  chamarras: { ancho: 80, alto: 78, silueta: CHAMARRA },
  shorts: {
    ancho: 56, alto: 52,
    silueta: [[0.1, 0], [0.9, 0], [1, 0.88], [0.58, 0.96], [0.5, 0.4], [0.42, 0.96], [0, 0.88]],
  },
  pantalones: {
    ancho: 52, alto: 106,
    silueta: [[0.08, 0], [0.92, 0], [1, 1], [0.6, 1], [0.5, 0.28], [0.4, 1], [0, 1]],
  },
  calzado: {
    ancho: 34, alto: 16,
    silueta: [[0, 0.75], [0.02, 0.35], [0.18, 0.15], [0.32, 0.1], [0.45, 0.38], [0.75, 0.5], [0.95, 0.6], [1, 0.85], [0.98, 1], [0.02, 1]],
  },
  accesorios: {
    ancho: 32, alto: 32,
    silueta: [[0.15, 0.3], [0.32, 0.3], [0.35, 0.05], [0.65, 0.05], [0.68, 0.3], [0.85, 0.3], [0.95, 1], [0.05, 1]],
  },
};

export function marcoDe(claveCategoria: string): MarcoCategoria {
  return MARCOS[claveCategoria] ?? MARCOS.accesorios;
}

export const ALTO_CM_MIN = 1;
export const ALTO_CM_MAX = 300;

/** Redondea a 0.1 cm dentro del rango que acepta la BD. */
export function normalizarAltoCm(cm: number): number {
  return Math.round(Math.min(ALTO_CM_MAX, Math.max(ALTO_CM_MIN, cm)) * 10) / 10;
}

/** Alto (cm) de una caja de anchoPx × altoPx encajada en el marco de la categoría (sin salirse). */
export function altoCmAjustado(claveCategoria: string, anchoPx: number, altoPx: number): number {
  const m = marcoDe(claveCategoria);
  return normalizarAltoCm(Math.min(m.alto, (m.ancho * altoPx) / anchoPx));
}
