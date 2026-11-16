import { cn } from "@/lib/utils";
import type { Prenda } from "@/lib/types";
import { firmaOutfit, type Outfit, type Ranura } from "../lib/generarOutfit";
import ImagenPrenda from "./ImagenPrenda";

interface Props {
  outfit: Outfit;
  /** Ranura a destacar: se trae al frente y el resto se atenúa */
  resaltada?: Ranura | null;
  className?: string;
}

// Composición en cm: cada prenda se dibuja a su tamaño real (altoCm), así todas quedan a la misma escala.
const SEPARACION_GORRA = 3; // entre la gorra y los tops
const TRASLAPE_TOPS = 0.12; // fracción del alto de los tops que cubre el pantalón
const TRASLAPE_TOPS_MAX = 9;
const TRASLAPE_CALZADO = 4; // el bajo del pantalón cubre un poco el calzado
const VISIBLE_CAPA = 0.4; // fracción del ancho de una capa de atrás que asoma junto a la de enfrente
const SUBE_CAPA = 2; // cada capa de atrás asoma un poco más arriba (cm)
const SEPARACION_ACCESORIO = 5;
const MARGEN = 0.06; // del lado mayor
const PROPORCION = 3 / 4; // ancho / alto del lienzo

interface Pieza {
  prenda: Prenda;
  ranura: Ranura;
  x: number; // cm, borde izquierdo (0 = eje del cuerpo)
  y: number; // cm, borde superior
  w: number;
  h: number;
  z: number;
}

const medidas = (p: Prenda) => ({ h: p.altoCm, w: (p.altoCm * p.ancho) / p.alto });

/**
 * Acomoda el outfit en cm: gorra, tops en abanico, bottom, calzado y accesorio a un lado. En los tops la base va
 * al frente y al centro; la capa 2 asoma por la derecha y la 3 por la izquierda, para que se vean todas.
 */
function componer(o: Outfit): Pieza[] {
  const piezas: Pieza[] = [];
  let y = 0;

  if (o.gorra) {
    const { w, h } = medidas(o.gorra);
    piezas.push({ prenda: o.gorra, ranura: "gorra", x: -w / 2, y, w, h, z: 6 });
    y += h + SEPARACION_GORRA;
  }

  // Capas, de la base (frente) hacia afuera (atrás)
  const capas = (["capa1", "capa2", "capa3"] as const).filter((r) => o[r]).map((r) => ({ ranura: r, prenda: o[r]!, ...medidas(o[r]!) }));
  const yTops = y + SUBE_CAPA * Math.max(0, capas.length - 1);
  let altoTops = 0;
  if (capas.length) {
    // Posición del centro de cada capa: la de enfrente al centro, las demás alternando derecha e izquierda
    const centros = capas.map((c, i) => {
      if (i === 0) return 0;
      const lado = capas.length === 2 ? -1 : i === 1 ? 1 : -1;
      const delante = capas[0];
      return lado * (delante.w / 2 + c.w * VISIBLE_CAPA - c.w / 2);
    });
    // Con dos capas, el par se centra sobre el eje
    const desfase = capas.length === 2 ? -centros[1] / 2 : 0;
    capas.forEach((c, i) => {
      const top = yTops - SUBE_CAPA * i;
      piezas.push({ prenda: c.prenda, ranura: c.ranura, x: centros[i] + desfase - c.w / 2, y: top, w: c.w, h: c.h, z: 5 - i });
      altoTops = Math.max(altoTops, top + c.h - yTops);
    });
    y = yTops + altoTops - Math.min(TRASLAPE_TOPS_MAX, altoTops * TRASLAPE_TOPS);
  }

  if (o.bottom) {
    const { w, h } = medidas(o.bottom);
    piezas.push({ prenda: o.bottom, ranura: "bottom", x: -w / 2, y, w, h, z: 2 });
    y += h - TRASLAPE_CALZADO;
  }
  if (o.calzado) {
    const { w, h } = medidas(o.calzado);
    piezas.push({ prenda: o.calzado, ranura: "calzado", x: -w / 2, y, w, h, z: 1 });
  }

  if (o.accesorio) {
    const { w, h } = medidas(o.accesorio);
    const derecha = Math.max(0, ...piezas.map((p) => p.x + p.w));
    const centroY = capas.length ? yTops + altoTops * 0.65 : y / 2;
    piezas.push({ prenda: o.accesorio, ranura: "accesorio", x: derecha + SEPARACION_ACCESORIO, y: centroY - h / 2, w, h, z: 7 });
  }
  return piezas;
}

/** Outfit armado como collage sobre un lienzo neutro, con cada prenda a su tamaño real. */
export default function LienzoOutfit({ outfit, resaltada, className }: Props) {
  const piezas = componer(outfit);

  // Caja del conjunto + margen, encajada en un lienzo 3:4
  let W = 1, H = 1, ox = 0, oy = 0;
  if (piezas.length) {
    const minX = Math.min(...piezas.map((p) => p.x));
    const maxX = Math.max(...piezas.map((p) => p.x + p.w));
    const minY = Math.min(...piezas.map((p) => p.y));
    const maxY = Math.max(...piezas.map((p) => p.y + p.h));
    const m = Math.max(maxX - minX, maxY - minY) * MARGEN;
    const w0 = maxX - minX + 2 * m;
    const h0 = maxY - minY + 2 * m;
    if (w0 / h0 > PROPORCION) {
      W = w0;
      H = w0 / PROPORCION;
    } else {
      H = h0;
      W = h0 * PROPORCION;
    }
    ox = (W - (maxX - minX)) / 2 - minX;
    oy = (H - (maxY - minY)) / 2 - minY;
  }
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  const hayResaltada = !!resaltada && piezas.some((p) => p.ranura === resaltada);

  return (
    <div className={cn("relative w-full aspect-[3/4] rounded-2xl bg-stone-100 overflow-hidden", className)}>
      <div key={firmaOutfit(outfit)} className="absolute inset-0 animate-[outfit-in_.35s_ease-out]">
        {piezas.map((p) => {
          const activa = hayResaltada && p.ranura === resaltada;
          return (
            <div
              key={p.prenda.id}
              className={cn(
                "absolute transition-[opacity,transform] duration-200",
                hayResaltada && !activa && "opacity-25",
                activa && "scale-[1.03]",
              )}
              style={{
                left: pct(p.x + ox, W),
                top: pct(p.y + oy, H),
                width: pct(p.w, W),
                height: pct(p.h, H),
                zIndex: activa ? 20 : p.z,
              }}
            >
              <ImagenPrenda prenda={p.prenda} className="w-full h-full" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
