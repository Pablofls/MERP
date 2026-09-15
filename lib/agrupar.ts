import type { Pendiente } from "./types";
import { etiquetaFecha } from "./utils";
import type { OrdenFecha } from "./hooks/useOrdenFecha";

export interface GrupoTimeline {
  label: string;
  fecha: string | null;
  items: Pendiente[];
}

export function agruparPorDia(items: Pendiente[], orden: OrdenFecha = "desc"): GrupoTimeline[] {
  const conFecha = [...items.filter((p) => p.fechaLimite)].sort((a, b) =>
    orden === "desc"
      ? (a.fechaLimite! > b.fechaLimite! ? -1 : 1)
      : (a.fechaLimite! < b.fechaLimite! ? -1 : 1)
  );
  const sinFecha = items.filter((p) => !p.fechaLimite);

  const mapa = new Map<string, Pendiente[]>();
  for (const p of conFecha) {
    const key = p.fechaLimite!;
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key)!.push(p);
  }

  const grupos: GrupoTimeline[] = Array.from(mapa.entries()).map(([fecha, grp]) => ({
    label: etiquetaFecha(fecha),
    fecha,
    items: grp,
  }));
  if (sinFecha.length > 0) grupos.unshift({ label: "Sin fecha", fecha: null, items: sinFecha });
  return grupos;
}
