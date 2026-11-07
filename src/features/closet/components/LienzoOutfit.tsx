import { cn } from "@/lib/utils";
import type { Prenda } from "@/lib/types";
import { firmaOutfit, type Outfit } from "../lib/generarOutfit";
import ImagenPrenda from "./ImagenPrenda";

interface Props {
  outfit: Outfit;
  /** Ids de prendas con candado */
  fijas?: Set<string>;
  onAlternarFija?: (p: Prenda) => void;
  className?: string;
}

// Composición en cm: cada prenda se dibuja a su tamaño real (altoCm), así todas quedan a la misma escala.
const SEPARACION_GORRA = 3; // entre la gorra y los tops
const TRASLAPE_TOPS = 0.12; // fracción del alto de los tops que cubre el pantalón
const TRASLAPE_TOPS_MAX = 9;
const TRASLAPE_CALZADO = 4; // el bajo del pantalón cubre un poco el calzado
const PASO_CAPA = 15; // desplazamiento horizontal entre capas de tops
const SEPARACION_ACCESORIO = 5;
const MARGEN = 0.06; // del lado mayor
const PROPORCION = 3 / 4; // ancho / alto del lienzo

interface Pieza {
  prenda: Prenda;
  x: number; // cm, borde izquierdo (0 = eje del cuerpo)
  y: number; // cm, borde superior
  w: number;
  h: number;
  z: number;
}

const medidas = (p: Prenda) => ({ h: p.altoCm, w: (p.altoCm * p.ancho) / p.alto });

/** Acomoda el outfit en cm: gorra, tops por capas (alineados por los hombros), bottom, calzado y accesorio a un lado. */
function componer(o: Outfit): Pieza[] {
  const piezas: Pieza[] = [];
  let y = 0;

  if (o.gorra) {
    const { w, h } = medidas(o.gorra);
    piezas.push({ prenda: o.gorra, x: -w / 2, y, w, h, z: 6 });
    y += h + SEPARACION_GORRA;
  }

  // Capas: la exterior atrás a la izquierda, la base al frente a la derecha
  const capas = [o.capa3, o.capa2, o.capa1].filter((p): p is Prenda => !!p);
  const yTops = y;
  let altoTops = 0;
  capas.forEach((p, i) => {
    const { w, h } = medidas(p);
    const centro = (i - (capas.length - 1) / 2) * PASO_CAPA;
    piezas.push({ prenda: p, x: centro - w / 2, y: yTops, w, h, z: 3 + i });
    altoTops = Math.max(altoTops, h);
  });
  if (capas.length) y = yTops + altoTops - Math.min(TRASLAPE_TOPS_MAX, altoTops * TRASLAPE_TOPS);

  if (o.bottom) {
    const { w, h } = medidas(o.bottom);
    piezas.push({ prenda: o.bottom, x: -w / 2, y, w, h, z: 2 });
    y += h - TRASLAPE_CALZADO;
  }
  if (o.calzado) {
    const { w, h } = medidas(o.calzado);
    piezas.push({ prenda: o.calzado, x: -w / 2, y, w, h, z: 1 });
  }

  if (o.accesorio) {
    const { w, h } = medidas(o.accesorio);
    const derecha = Math.max(0, ...piezas.map((p) => p.x + p.w));
    const centroY = capas.length ? yTops + altoTops * 0.65 : y / 2;
    piezas.push({ prenda: o.accesorio, x: derecha + SEPARACION_ACCESORIO, y: centroY - h / 2, w, h, z: 7 });
  }
  return piezas;
}

function Candado({ fija, onClick }: { fija: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={fija}
      aria-label={fija ? "Quitar candado" : "Fijar prenda"}
      title={fija ? "Quitar candado" : "Fijar: se conserva al generar otro"}
      className={cn(
        "absolute top-0 right-0 z-20 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all",
        fija
          ? "bg-blue-900 text-white"
          : "bg-white/90 text-gray-500 hover:text-gray-900 lg:opacity-0 lg:group-hover/pieza:opacity-100 focus-visible:opacity-100",
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

/** Outfit armado como collage sobre un lienzo neutro, con cada prenda a su tamaño real. */
export default function LienzoOutfit({ outfit, fijas, onAlternarFija, className }: Props) {
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

  return (
    <div className={cn("relative w-full aspect-[3/4] rounded-2xl bg-stone-100 overflow-hidden", className)}>
      <div key={firmaOutfit(outfit)} className="absolute inset-0 animate-[outfit-in_.35s_ease-out]">
        {piezas.map((p) => (
          <div
            key={p.prenda.id}
            className="absolute group/pieza"
            style={{ left: pct(p.x + ox, W), top: pct(p.y + oy, H), width: pct(p.w, W), height: pct(p.h, H), zIndex: p.z }}
          >
            <ImagenPrenda prenda={p.prenda} className="w-full h-full" />
            {onAlternarFija && <Candado fija={!!fijas?.has(p.prenda.id)} onClick={() => onAlternarFija(p.prenda)} />}
          </div>
        ))}
      </div>
    </div>
  );
}
