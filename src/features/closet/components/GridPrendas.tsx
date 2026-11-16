"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Prenda } from "@/lib/types";
import { CATEGORIAS, etiquetaCategoria, type ClaveGrupo } from "../lib/catalogo";
import ImagenPrenda from "./ImagenPrenda";

interface Props {
  prendas: Prenda[];
  grupo: ClaveGrupo | null;
  onSeleccionar: (p: Prenda) => void;
  /** Ids de las prendas que están en el outfit */
  enOutfit?: Set<string>;
  /** Pone o quita la prenda del outfit */
  onAlternarOutfit?: (p: Prenda) => void;
}

/** Prendas agrupadas por categoría (orden del catálogo), una fila deslizable por categoría. */
export default function GridPrendas({ prendas, grupo, onSeleccionar, enOutfit, onAlternarOutfit }: Props) {
  const secciones = CATEGORIAS.filter((c) => !grupo || c.grupo === grupo)
    .map((c) => ({ c, items: prendas.filter((p) => p.categoria === c.clave) }))
    .filter((s) => s.items.length > 0);

  if (secciones.length === 0) {
    return <EmptyState title="Nada por aquí" description="Todavía no tienes prendas de este tipo." />;
  }

  return (
    <div className="space-y-6">
      {secciones.map(({ c, items }) => (
        <Fila key={c.clave} titulo={etiquetaCategoria(c)} total={items.length}>
          {items.map((p) => (
            <Tarjeta
              key={p.id}
              prenda={p}
              enOutfit={!!enOutfit?.has(p.id)}
              onSeleccionar={() => onSeleccionar(p)}
              onAlternarOutfit={onAlternarOutfit && (() => onAlternarOutfit(p))}
            />
          ))}
        </Fila>
      ))}
    </div>
  );
}

/** Carrusel horizontal con flechas a los lados cuando hay más prendas de las que caben. */
function Fila({ titulo, total, children }: { titulo: string; total: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [puede, setPuede] = useState({ izq: false, der: false });

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setPuede({ izq: el.scrollLeft > 4, der: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [medir, total]);

  const desplazar = (dir: -1 | 1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="group/fila">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {titulo}
        <span className="ml-1.5 font-normal text-gray-300">{total}</span>
      </h3>
      <div className="relative">
        <div
          ref={ref}
          onScroll={medir}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {children}
        </div>
        <FlechaFila dir={-1} visible={puede.izq} onClick={() => desplazar(-1)} />
        <FlechaFila dir={1} visible={puede.der} onClick={() => desplazar(1)} />
      </div>
    </section>
  );
}

function FlechaFila({ dir, visible, onClick }: { dir: -1 | 1; visible: boolean; onClick: () => void }) {
  if (!visible) return null;
  return (
    <>
      {/* Desvanecido del borde para insinuar que hay más */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 w-10 from-gray-50 to-transparent",
          dir < 0 ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l",
        )}
      />
      <button
        type="button"
        onClick={onClick}
        aria-label={dir < 0 ? "Ver anteriores" : "Ver más"}
        className={cn(
          "hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center text-gray-700 hover:text-gray-900 hover:scale-105 transition-all opacity-0 group-hover/fila:opacity-100 focus-visible:opacity-100",
          dir < 0 ? "left-1" : "right-1",
        )}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={dir < 0 ? "M15.75 19.5 8.25 12l7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"} />
        </svg>
      </button>
    </>
  );
}

function Tarjeta({
  prenda,
  enOutfit,
  onSeleccionar,
  onAlternarOutfit,
}: {
  prenda: Prenda;
  enOutfit: boolean;
  onSeleccionar: () => void;
  onAlternarOutfit?: () => void;
}) {
  return (
    <div className="group/tarjeta relative shrink-0 snap-start w-36 sm:w-44 2xl:w-52">
      <button
        type="button"
        onClick={onSeleccionar}
        title={prenda.nombre ? `${prenda.nombre} · editar` : "Editar prenda"}
        className={cn(
          "block w-full aspect-square rounded-2xl bg-stone-100 hover:bg-stone-200/70 p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900",
          enOutfit && "ring-2 ring-blue-900/80 ring-inset",
        )}
      >
        <ImagenPrenda prenda={prenda} className="w-full h-full transition-transform duration-200 group-hover/tarjeta:scale-105" />
      </button>
      {onAlternarOutfit && (
        <button
          type="button"
          onClick={onAlternarOutfit}
          aria-pressed={enOutfit}
          title={enOutfit ? "Quitar del outfit" : "Ponerla en el outfit"}
          className={cn(
            "absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm transition-all",
            enOutfit
              ? "bg-blue-900 text-white"
              : "bg-white/95 text-gray-700 hover:text-gray-900 md:opacity-0 md:group-hover/tarjeta:opacity-100 focus-visible:opacity-100",
          )}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={enOutfit ? "m4.5 12.75 6 6 9-13.5" : "M12 4.5v15m7.5-7.5h-15"} />
          </svg>
          {enOutfit ? "En outfit" : "Usar"}
        </button>
      )}
    </div>
  );
}
