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
