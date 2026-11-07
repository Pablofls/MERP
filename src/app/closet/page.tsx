"use client";
import { useState } from "react";
import { usePrendas } from "@/features/closet/hooks/usePrendas";
import { GRUPOS, grupoDe, type ClaveGrupo } from "@/features/closet/lib/catalogo";
import GridPrendas from "@/features/closet/components/GridPrendas";
import GeneradorOutfit from "@/features/closet/components/GeneradorOutfit";
import AgregarPrenda from "@/features/closet/components/AgregarPrenda";
import DetallePrenda from "@/features/closet/components/DetallePrenda";
import FiltroChips from "@/components/ui/FiltroChips";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { Prenda } from "@/lib/types";

type Vista = "prendas" | "outfit";

export default function ClosetPage() {
  const { prendas, cargando, agregarPrenda, editarPrenda, eliminarPrenda } = usePrendas();
  const [agregando, setAgregando] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Prenda | null>(null);
  const [grupo, setGrupo] = useState<ClaveGrupo | null>(null);
  const [vista, setVista] = useState<Vista>("prendas");

  const opcionesFiltro = [
    { id: null, label: "Todo" },
    ...GRUPOS.filter((g) => prendas.some((p) => grupoDe(p.categoria) === g.clave)).map((g) => ({ id: g.clave, label: g.nombre })),
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Closet</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {prendas.length} {prendas.length === 1 ? "prenda" : "prendas"}
          </p>
        </div>
        <button
          onClick={() => setAgregando(true)}
          data-tutorial-id="btn-agregar-prenda"
          className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar
        </button>
      </div>

      {/* Móvil: prendas u outfit */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg lg:hidden">
        {(["prendas", "outfit"] as Vista[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={cn(
              "py-1.5 rounded-md text-sm font-medium transition-colors",
              vista === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500",
            )}
          >
            {v === "prendas" ? "Prendas" : "Outfit"}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
        <section className={cn("min-w-0", vista !== "prendas" && "hidden lg:block")}>
          {cargando && prendas.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 pt-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : prendas.length === 0 ? (
            <div className="text-center">
              <EmptyState title="Tu closet está vacío" description="Sube una foto de una prenda y recorta su contorno para empezar." />
              <button
                onClick={() => setAgregando(true)}
                className="bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Agregar prenda
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <FiltroChips opciones={opcionesFiltro} valor={grupo} onChange={(id) => setGrupo(id as ClaveGrupo | null)} />
              <GridPrendas prendas={prendas} grupo={grupo} onSeleccionar={setSeleccionada} />
            </div>
          )}
        </section>

        <aside className={cn("lg:sticky lg:top-6 space-y-3", vista !== "outfit" && "hidden lg:block")}>
          <h2 className="hidden lg:block text-xs font-semibold text-gray-500 uppercase tracking-wide">Outfit</h2>
          <GeneradorOutfit prendas={prendas} />
        </aside>
      </div>

      <AgregarPrenda open={agregando} onClose={() => setAgregando(false)} onGuardar={agregarPrenda} />
      <DetallePrenda
        prenda={seleccionada}
        onClose={() => setSeleccionada(null)}
        onGuardar={editarPrenda}
        onEliminar={eliminarPrenda}
      />
    </div>
  );
}
