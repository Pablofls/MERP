"use client";
import { useState } from "react";
import type { Pendiente, Materia } from "@/lib/types";
import { formatFechaCorta, esFechaVencida, etiquetaFecha, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import FormPendiente from "./FormPendiente";
import DetallePendiente from "./DetallePendiente";
import PendienteItem from "./PendienteItem";
import EmptyState from "@/components/ui/EmptyState";

interface Props {
  pendientes: Pendiente[];
  materias: Materia[];
  onToggle: (id: string) => void;
  onAgregar: (datos: Omit<Pendiente, "id" | "completado">) => void;
  onEditar: (id: string, datos: Partial<Pick<Pendiente, "titulo" | "descripcion" | "fechaLimite" | "materiaId">>) => void;
  onEliminar: (id: string) => void;
}

function agruparPorDia(items: Pendiente[]) {
  const conFecha = [...items.filter((p) => p.fechaLimite)].sort((a, b) =>
    a.fechaLimite! < b.fechaLimite! ? -1 : 1
  );
  const sinFecha = items.filter((p) => !p.fechaLimite);

  const mapa = new Map<string, Pendiente[]>();
  for (const p of conFecha) {
    const key = p.fechaLimite!;
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key)!.push(p);
  }

  const grupos: { label: string; items: Pendiente[] }[] = Array.from(mapa.entries()).map(
    ([fecha, items]) => ({ label: etiquetaFecha(fecha), items })
  );
  if (sinFecha.length > 0) grupos.push({ label: "Sin fecha", items: sinFecha });
  return grupos;
}

export default function PendientesHoy({ pendientes, materias, onToggle, onAgregar, onEditar, onEliminar }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [detalle, setDetalle] = useState<Pendiente | null>(null);

  const pendientesFiltrados = pendientes.filter((p) =>
    mostrarCompletados ? true : !p.completado
  );
  const grupos = agruparPorDia(pendientesFiltrados);

  const getMat = (id?: string) => materias.find((m) => m.id === id);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pendientes</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarCompletados(!mostrarCompletados)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {mostrarCompletados ? "Ocultar completados" : "Ver todos"}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-900 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar
          </button>
        </div>
      </div>

      {pendientesFiltrados.length === 0 ? (
        <EmptyState title="Sin pendientes" description="Todo al dia" />
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <div key={grupo.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{grupo.label}</p>
              <ul className="divide-y divide-gray-100">
                {grupo.items.map((p) => {
                  const mat = getMat(p.materiaId);
                  const vencido = !p.completado && p.fechaLimite && esFechaVencida(p.fechaLimite);
                  return (
                    <PendienteItem
                      key={p.id}
                      pendiente={p}
                      onToggle={onToggle}
                      onClick={() => setDetalle(p)}
                    >
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {p.tipo === "escolar" ? (
                          <Badge color={mat?.color ?? "#1e4976"}>{mat?.nombre ?? "Escolar"}</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border border-gray-200">Personal</Badge>
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
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo pendiente">
        <FormPendiente
          materias={materias}
          onSubmit={(datos) => {
            onAgregar(datos);
            setModalOpen(false);
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <DetallePendiente
        pendiente={detalle}
        materias={materias}
        onClose={() => setDetalle(null)}
        onToggle={(id) => { onToggle(id); setDetalle(null); }}
        onEditar={onEditar}
        onEliminar={onEliminar}
      />
    </section>
  );
}
