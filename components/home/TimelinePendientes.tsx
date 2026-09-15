"use client";
import { useEffect, useRef } from "react";
import type { Pendiente, Materia, CategoriaPersonal } from "@/lib/types";
import { esFechaVencida, fechaHoy, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { etiquetaTipo, colorTipo } from "@/components/escolar/FechasImportantes";
import PendienteCard from "./PendienteCard";

export interface GrupoTimeline {
  label: string;
  fecha: string | null;
  items: Pendiente[];
}

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
  const hoyRef = useRef<HTMLDivElement>(null);
  const yaCentrado = useRef(false);

  // Al abrir, centrar la linea de tiempo en el dia de hoy
  useEffect(() => {
    if (yaCentrado.current) return;
    const cont = scrollRef.current;
    const col = hoyRef.current;
    if (!cont || !col) return;
    yaCentrado.current = true;
    cont.scrollLeft = Math.max(0, col.offsetLeft - cont.clientWidth / 2 + col.clientWidth / 2);
  }, [grupos]);

  const getMat = (id?: string) => materias.find((m) => m.id === id);
  const getCat = (id?: string) => categorias.find((c) => c.id === id);

  return (
    <div ref={scrollRef} className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory pb-2">
      <div className="flex min-w-max items-stretch">
        {grupos.map((grupo, i) => {
          const esHoy = grupo.fecha === hoy;
          const vencidoGrupo = !!grupo.fecha && esFechaVencida(grupo.fecha);
          const pendientesAbiertos = grupo.items.filter((p) => !p.completado).length;

          return (
            <div
              key={grupo.label}
              ref={esHoy ? hoyRef : undefined}
              className="w-[210px] flex-shrink-0 snap-start"
            >
              {/* Encabezado del punto */}
              <div className="px-1.5">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide truncate",
                    esHoy ? "text-blue-900" : vencidoGrupo ? "text-red-600" : "text-gray-500"
                  )}
                >
                  {grupo.label}
                </p>
                <p className="text-[11px] text-gray-400">
                  {pendientesAbiertos > 0
                    ? `${pendientesAbiertos} pendiente${pendientesAbiertos > 1 ? "s" : ""}`
                    : "Sin abiertos"}
                </p>
              </div>

              {/* Riel + punto */}
              <div className="relative h-5 my-2">
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-px bg-gray-200",
                    i === 0 ? "left-3" : "left-0",
                    i === grupos.length - 1 ? "right-3" : "right-0"
                  )}
                />
                <span
                  className={cn(
                    "absolute top-1/2 left-1.5 -translate-y-1/2 rounded-full border-2 bg-white",
                    esHoy
                      ? "w-3.5 h-3.5 border-blue-900 ring-4 ring-blue-900/10"
                      : vencidoGrupo
                      ? "w-3 h-3 border-red-400"
                      : "w-3 h-3 border-gray-300"
                  )}
                  style={esHoy ? { backgroundColor: "#1e3a8a" } : undefined}
                />
              </div>

              {/* Tarjetas */}
              <div className="px-1.5 space-y-2">
                {grupo.items.map((p) => {
                  const mat = getMat(p.materiaId);
                  const cat = getCat(p.categoriaPersonalId);
                  const vencido = !p.completado && !!p.fechaLimite && esFechaVencida(p.fechaLimite);
                  return (
                    <PendienteCard
                      key={p.id}
                      pendiente={p}
                      vencido={vencido}
                      onToggle={onToggle}
                      onClick={() => onSeleccionar(p)}
                    >
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
                      {p.descripcion && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.descripcion}</p>
                      )}
                    </PendienteCard>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
