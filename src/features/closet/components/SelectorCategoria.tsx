"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GRUPOS, categoriasDe, grupoDe, type ClaveGrupo } from "../lib/catalogo";

const ETIQUETA = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2";
const opcion = (activa: boolean) =>
  cn(
    "rounded-lg text-sm font-medium border transition-all text-left",
    activa ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
  );

const AYUDA_CAPA: Record<number, string> = {
  1: "La base: va directo sobre el cuerpo",
  2: "Va sobre la camisa o camiseta",
  3: "Va encima de todo; también puede ir directo sobre la camiseta",
};

/** Elige primero el grupo (Gorras, Tops, …) y luego la categoría; si el grupo tiene una sola, se elige sola. */
export default function SelectorCategoria({
  valor,
  onChange,
}: {
  valor: string | null;
  onChange: (categoria: string | null) => void;
}) {
  const [grupo, setGrupo] = useState<ClaveGrupo | null>(valor ? (grupoDe(valor) ?? null) : null);
  const categorias = grupo ? categoriasDe(grupo) : [];

  function elegirGrupo(g: ClaveGrupo) {
    setGrupo(g);
    const cs = categoriasDe(g);
    if (cs.length === 1) onChange(cs[0].clave);
    else if (!valor || grupoDe(valor) !== g) onChange(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <span className={ETIQUETA}>¿Qué es?</span>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {GRUPOS.map((g) => (
            <button
              key={g.clave}
              type="button"
              onClick={() => elegirGrupo(g.clave)}
              title={g.descripcion}
              className={cn(opcion(grupo === g.clave), "py-2.5 px-2 text-center")}
            >
              {g.nombre}
            </button>
          ))}
        </div>
      </div>

      {categorias.length > 1 && (
        <div>
          <span className={ETIQUETA}>{grupo === "tops" ? "Capa" : "Tipo"}</span>
          <div className="grid gap-2">
            {categorias.map((c) => (
              <button
                key={c.clave}
                type="button"
                onClick={() => onChange(c.clave)}
                className={cn(opcion(valor === c.clave), "px-3 py-2.5 flex items-center gap-3")}
              >
                {c.capa && (
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      valor === c.clave ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {c.capa}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block">{c.nombre}</span>
                  {c.capa && (
                    <span className={cn("block text-[11px] font-normal", valor === c.clave ? "text-blue-100" : "text-gray-400")}>
                      {AYUDA_CAPA[c.capa]}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
