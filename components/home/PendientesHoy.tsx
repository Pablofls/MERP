"use client";
import { useState } from "react";
import type { Pendiente, Materia } from "@/lib/types";
import { formatFechaCorta, esFechaVencida, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import FormPendiente from "./FormPendiente";
import EmptyState from "@/components/ui/EmptyState";

interface Props {
  pendientes: Pendiente[];
  materias: Materia[];
  onToggle: (id: string) => void;
  onAgregar: (datos: Omit<Pendiente, "id" | "completado">) => void;
}

export default function PendientesHoy({ pendientes, materias, onToggle, onAgregar }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);

  const pendientesFiltrados = pendientes.filter((p) =>
    mostrarCompletados ? true : !p.completado
  );

  const getMat = (id?: string) => materias.find((m) => m.id === id);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Pendientes</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarCompletados(!mostrarCompletados)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {mostrarCompletados ? "Ocultar completados" : "Ver todos"}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar
          </button>
        </div>
      </div>

      {pendientesFiltrados.length === 0 ? (
        <EmptyState icon="✅" title="Todo al día" description="No hay pendientes por hacer" />
      ) : (
        <ul className="space-y-2">
          {pendientesFiltrados.map((p) => {
            const mat = getMat(p.materiaId);
            const vencido = !p.completado && p.fechaLimite && esFechaVencida(p.fechaLimite);
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border bg-white transition-all",
                  p.completado ? "opacity-50" : "border-gray-200"
                )}
              >
                <button
                  onClick={() => onToggle(p.id)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                    p.completado
                      ? "bg-indigo-600 border-indigo-600"
                      : p.tipo === "personal"
                      ? "border-emerald-400 hover:border-emerald-600"
                      : "border-indigo-400 hover:border-indigo-600"
                  )}
                >
                  {p.completado && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", p.completado && "line-through text-gray-400")}>
                    {p.titulo}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {p.tipo === "escolar" ? (
                      <Badge color={mat?.color ?? "#6366f1"}>{mat?.nombre ?? "Escolar"}</Badge>
                    ) : (
                      <Badge color="#10b981">Personal</Badge>
                    )}
                    {p.fechaLimite && (
                      <span className={cn("text-xs", vencido ? "text-red-500 font-medium" : "text-gray-400")}>
                        {vencido ? "⚠ " : ""}{formatFechaCorta(p.fechaLimite)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
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
    </section>
  );
}
