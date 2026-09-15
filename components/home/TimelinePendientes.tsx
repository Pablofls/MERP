"use client";
import { useEffect, useRef } from "react";
import type { Pendiente, Materia, CategoriaPersonal } from "@/lib/types";
import { esFechaVencida, fechaHoy, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { etiquetaTipo, colorTipo } from "@/components/escolar/FechasImportantes";
import PendienteCard from "./PendienteCard";
import type { GrupoTimeline } from "@/lib/agrupar";

export type { GrupoTimeline };

interface Props {
  grupos: GrupoTimeline[];
  materias: Materia[];
  categorias: CategoriaPersonal[];
  onToggle: (id: string) => void;
  onSeleccionar: (p: Pendiente) => void;
}

export default function TimelinePendientes({ grupos, materias, categorias, onToggle, onSeleccionar }: Props) {
  const hoy = fechaHoy();
  const scrollRef = useRef<HTMLDivElement>(null);
  const puntoRef = useRef<HTMLSpanElement>(null);
  const yaCentrado = useRef(false);

  // Columna a centrar: hoy, o el dia futuro mas cercano si hoy no tiene nada
  const idxHoy = grupos.findIndex((g) => g.fecha === hoy);
  const idxCentro =
    idxHoy !== -1
      ? idxHoy
      : (() => {
          const futuro = grupos.findIndex((g) => g.fecha && g.fecha > hoy);
          if (futuro !== -1) return futuro;
          const conFecha = grupos.map((g, i) => (g.fecha ? i : -1)).filter((i) => i !== -1);
          return conFecha.length > 0 ? conFecha[conFecha.length - 1] : -1;
        })();

  // Al abrir, dejar ese dia al centro de la linea de tiempo
  useEffect(() => {
    if (yaCentrado.current) return;
    const cont = scrollRef.current;
    const punto = puntoRef.current;
    if (!cont || !punto) return;
    yaCentrado.current = true;
    const contRect = cont.getBoundingClientRect();
    const puntoRect = punto.getBoundingClientRect();
    const delta = puntoRect.left + puntoRect.width / 2 - (contRect.left + cont.clientWidth / 2);
    cont.scrollLeft = Math.max(0, cont.scrollLeft + delta);
  }, [grupos]);

  const getMat = (id?: string) => materias.find((m) => m.id === id);
  const getCat = (id?: string) => categorias.find((c) => c.id === id);

  function tarjetas(grupo: GrupoTimeline) {
    return grupo.items.map((p) => {
      const mat = getMat(p.materiaId);
      const cat = getCat(p.categoriaPersonalId);
      const vencido = !p.completado && !!p.fechaLimite && esFechaVencida(p.fechaLimite);
      return (
        <div key={p.id} className="w-[190px] flex-shrink-0">
          <PendienteCard pendiente={p} vencido={vencido} onToggle={onToggle} onClick={() => onSeleccionar(p)}>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {p.tipoEvaluacion ? (
                <>
                  <Badge color={colorTipo(p.tipoEvaluacion)}>{etiquetaTipo(p.tipoEvaluacion)}</Badge>
                  {mat && <Badge color={mat.color}>{mat.nombre}</Badge>}
                </>
              ) : p.tipo === "escolar" ? (
                <Badge color={mat?.color ?? "#1e4976"}>{mat?.nombre ?? "Escolar"}</Badge>
              ) : (
                <Badge color={cat?.color ?? "#4a3a6b"}>{cat?.nombre ?? "Personal"}</Badge>
              )}
              {vencido && <span className="text-xs text-red-600 font-medium">Vencido</span>}
            </div>
            {p.descripcion && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.descripcion}</p>}
          </PendienteCard>
        </div>
      );
    });
  }

  return (
    // Se sale del contenedor central para que la linea abarque todo el ancho disponible
    <div
      ref={scrollRef}
      className="overflow-x-auto px-4 -mx-4 lg:-mx-[max(0px,calc((100vw-14rem-42rem)/2-0.75rem))]"
    >
      <div className="relative w-max min-w-full py-2">
        {/* Riel continuo de extremo a extremo */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-300" />

        <div className="relative flex items-stretch gap-6">
          {grupos.map((grupo, i) => {
            const esHoy = grupo.fecha === hoy;
            const vencidoGrupo = !!grupo.fecha && esFechaVencida(grupo.fecha);
            const abiertos = grupo.items.filter((p) => !p.completado).length;
            const arriba = i % 2 === 0;

            return (
              <div key={grupo.label} className="grid grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] flex-shrink-0">
                {/* Zona superior */}
                <div className="flex items-end gap-2 pb-3">{arriba && tarjetas(grupo)}</div>

                {/* Punto sobre el riel + etiqueta */}
                <div className="flex items-center gap-2">
                  <span
                    ref={i === idxCentro ? puntoRef : undefined}
                    className={cn(
                      "rounded-full border-2 bg-white flex-shrink-0",
                      esHoy
                        ? "w-3.5 h-3.5 border-blue-900 ring-4 ring-blue-900/10"
                        : vencidoGrupo
                        ? "w-3 h-3 border-red-400"
                        : "w-3 h-3 border-gray-300"
                    )}
                    style={esHoy ? { backgroundColor: "#1e3a8a" } : undefined}
                  />
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide whitespace-nowrap bg-gray-50 pr-1",
                      esHoy ? "text-blue-900" : vencidoGrupo ? "text-red-600" : "text-gray-500"
                    )}
                  >
                    {grupo.label}
                    <span className="ml-1.5 font-normal normal-case text-gray-400">
                      {abiertos > 0 ? `${abiertos} pendiente${abiertos > 1 ? "s" : ""}` : "sin abiertos"}
                    </span>
                  </span>
                </div>

                {/* Zona inferior */}
                <div className="flex items-start gap-2 pt-3">{!arriba && tarjetas(grupo)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
