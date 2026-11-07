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

/**
 * Outfit armado como collage sobre un lienzo neutro: gorra, tops por capas (la exterior atrás a la izquierda,
 * la base al frente), bottom y calzado de arriba a abajo; el accesorio a un costado.
 */
export default function LienzoOutfit({ outfit, fijas, onAlternarFija, className }: Props) {
  const pieza = (p: Prenda, extra?: string, estilo?: React.CSSProperties) => (
    <div key={p.id} className={cn("relative h-full max-w-full flex items-center justify-center group/pieza", extra)} style={estilo}>
      <ImagenPrenda prenda={p} className="h-full w-auto max-w-full" />
      {onAlternarFija && <Candado fija={!!fijas?.has(p.id)} onClick={() => onAlternarFija(p)} />}
    </div>
  );
  const fila = (flex: number, contenido: React.ReactNode, extra?: string) => (
    <div className={cn("w-full min-h-0 flex items-center justify-center", extra)} style={{ flex: `${flex} 1 0%` }}>
      {contenido}
    </div>
  );

  const capas = [outfit.capa3, outfit.capa2, outfit.capa1].filter((p): p is Prenda => !!p);
  const anchoCapa = capas.length === 1 ? "100%" : capas.length === 2 ? "62%" : "48%";

  return (
    <div className={cn("relative w-full aspect-[3/4] rounded-2xl bg-stone-100 overflow-hidden", className)}>
      <div key={firmaOutfit(outfit)} className="absolute inset-0 flex flex-col items-center px-[10%] py-[5%] gap-[1.5%] animate-[outfit-in_.35s_ease-out]">
        {outfit.gorra && fila(1.5, pieza(outfit.gorra))}
        {capas.length > 0 &&
          fila(
            4,
            capas.map((p, i) => pieza(p, i > 0 ? "-ml-[16%]" : undefined, { maxWidth: anchoCapa, zIndex: i + 1 })),
          )}
        {outfit.bottom && fila(4.6, pieza(outfit.bottom))}
        {outfit.calzado && fila(1.4, pieza(outfit.calzado))}
      </div>
      {outfit.accesorio && (
        <div key={`acc-${outfit.accesorio.id}`} className="absolute right-[4%] top-[42%] w-[24%] h-[17%] z-10 flex justify-center animate-[outfit-in_.35s_ease-out]">
          {pieza(outfit.accesorio)}
        </div>
      )}
    </div>
  );
}
