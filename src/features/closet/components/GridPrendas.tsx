import EmptyState from "@/components/ui/EmptyState";
import type { Prenda } from "@/lib/types";
import { CATEGORIAS, etiquetaCategoria, type ClaveGrupo } from "../lib/catalogo";
import ImagenPrenda from "./ImagenPrenda";

/** Prendas agrupadas por categoría (orden del catálogo), filtradas por grupo si se indica. */
export default function GridPrendas({
  prendas,
  grupo,
  onSeleccionar,
}: {
  prendas: Prenda[];
  grupo: ClaveGrupo | null;
  onSeleccionar: (p: Prenda) => void;
}) {
  const secciones = CATEGORIAS.filter((c) => !grupo || c.grupo === grupo)
    .map((c) => ({ c, items: prendas.filter((p) => p.categoria === c.clave) }))
    .filter((s) => s.items.length > 0);

  if (secciones.length === 0) {
    return <EmptyState title="Nada por aquí" description="Todavía no tienes prendas de este tipo." />;
  }

  return (
    <div className="space-y-6">
      {secciones.map(({ c, items }) => (
        <section key={c.clave}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {etiquetaCategoria(c)}
            <span className="ml-1.5 font-normal text-gray-300">{items.length}</span>
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            {items.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSeleccionar(p)}
                title={p.nombre}
                className="aspect-square rounded-xl bg-stone-100 hover:bg-stone-200/70 p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900"
              >
                <ImagenPrenda prenda={p} className="w-full h-full" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
