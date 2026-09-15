"use client";
import type { Pendiente, Materia, CategoriaPersonal } from "@/lib/types";
import { formatFechaCorta, esFechaVencida, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { etiquetaTipo, colorTipo } from "@/components/escolar/FechasImportantes";
import PendienteItem from "./PendienteItem";
import type { GrupoTimeline } from "@/lib/agrupar";

interface Props {
  grupos: GrupoTimeline[];
  materias: Materia[];
  categorias: CategoriaPersonal[];
  onToggle: (id: string) => void;
  onSeleccionar: (p: Pendiente) => void;
}

export default function ListaPendientes({ grupos, materias, categorias, onToggle, onSeleccionar }: Props) {
  const getMat = (id?: string) => materias.find((m) => m.id === id);
  const getCat = (id?: string) => categorias.find((c) => c.id === id);

  return (
    <div className="space-y-4">
      {grupos.map((grupo) => (
        <div key={grupo.label}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{grupo.label}</p>
          <ul className="divide-y divide-gray-100">
            {grupo.items.map((p) => {
              const mat = getMat(p.materiaId);
              const cat = getCat(p.categoriaPersonalId);
              const vencido = !p.completado && p.fechaLimite && esFechaVencida(p.fechaLimite);
              return (
                <PendienteItem key={p.id} pendiente={p} onToggle={onToggle} onClick={() => onSeleccionar(p)}>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
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
                    {p.descripcion && (
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">{p.descripcion}</span>
                    )}
                    {p.fechaLimite && (
                      <span className={cn("text-xs", vencido ? "text-red-600 font-medium" : "text-gray-400")}>
                        {vencido ? "Vencido · " : ""}{formatFechaCorta(p.fechaLimite)}
                      </span>
                    )}
                  </div>
                </PendienteItem>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
