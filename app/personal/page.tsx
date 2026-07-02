"use client";
import { useState } from "react";
import { usePendientes } from "@/lib/hooks/usePendientes";
import { useMaterias } from "@/lib/hooks/useMaterias";
import type { Pendiente } from "@/lib/types";
import { formatFechaCorta, esFechaVencida, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { fechaHoy } from "@/lib/utils";

function FormPendientePersonal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (datos: Omit<Pendiente, "id" | "completado">) => void;
  onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fechaLimite: fechaLimite || undefined,
      tipo: "personal",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Título *</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="¿Qué tienes pendiente?"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalles opcionales..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha límite</label>
        <input
          type="date"
          value={fechaLimite}
          min={fechaHoy()}
          onChange={(e) => setFechaLimite(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancelar</button>
        <button type="submit" disabled={!titulo.trim()} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">Agregar</button>
      </div>
    </form>
  );
}

export default function PersonalPage() {
  const { pendientes, agregar, toggleCompletado, eliminar } = usePendientes();
  const { materias } = useMaterias();
  const [modalOpen, setModalOpen] = useState(false);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);

  const pendientesPersonales = pendientes.filter(
    (p) => p.tipo === "personal" && (mostrarCompletados || !p.completado)
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Personal</h1>
      <p className="text-sm text-gray-400 mb-5">
        {pendientes.filter((p) => p.tipo === "personal" && !p.completado).length} pendientes
      </p>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMostrarCompletados(!mostrarCompletados)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {mostrarCompletados ? "Ocultar completados" : "Ver todos"}
        </button>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar pendiente
        </button>
      </div>

      {pendientesPersonales.length === 0 ? (
        <EmptyState icon="✅" title="Todo al día" description="No hay pendientes personales" />
      ) : (
        <ul className="space-y-2">
          {pendientesPersonales.map((p) => {
            const vencido = !p.completado && p.fechaLimite && esFechaVencida(p.fechaLimite);
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border bg-white",
                  p.completado ? "opacity-50" : "border-gray-200"
                )}
              >
                <button
                  onClick={() => toggleCompletado(p.id)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                    p.completado
                      ? "bg-emerald-600 border-emerald-600"
                      : "border-emerald-400 hover:border-emerald-600"
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
                  {p.descripcion && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{p.descripcion}</p>
                  )}
                  {p.fechaLimite && (
                    <span className={cn("text-xs mt-1 inline-block", vencido ? "text-red-500 font-medium" : "text-gray-400")}>
                      {vencido ? "⚠ " : "📅 "}{formatFechaCorta(p.fechaLimite)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => eliminar(p.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo pendiente personal">
        <FormPendientePersonal
          onSubmit={(datos) => { agregar(datos); setModalOpen(false); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
