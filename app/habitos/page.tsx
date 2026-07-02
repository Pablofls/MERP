"use client";
import { useState } from "react";
import { useHabitos } from "@/lib/hooks/useHabitos";
import TarjetaHabito from "@/components/habitos/TarjetaHabito";
import CalendarioHabito from "@/components/habitos/CalendarioHabito";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { fechaHoy } from "@/lib/utils";
import type { Habito } from "@/lib/types";

function FormHabito({
  onSubmit,
  onCancel,
}: {
  onSubmit: (datos: Omit<Habito, "id" | "activo">) => void;
  onCancel: () => void;
}) {
  const [topico, setTopico] = useState("");
  const [tipoMedida, setTipoMedida] = useState<"numerica" | "booleana">("booleana");
  const [unidad, setUnidad] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topico.trim()) return;
    onSubmit({
      topico: topico.trim(),
      tipoMedida,
      unidad: tipoMedida === "numerica" ? (unidad.trim() || undefined) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hábito</label>
        <input
          type="text"
          value={topico}
          onChange={(e) => setTopico(e.target.value)}
          placeholder="ej. Correr, Leer, Meditar..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de medida</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipoMedida("booleana")}
            className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
              tipoMedida === "booleana"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            ✓ Sí / No
          </button>
          <button
            type="button"
            onClick={() => setTipoMedida("numerica")}
            className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
              tipoMedida === "numerica"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            # Cantidad
          </button>
        </div>
      </div>
      {tipoMedida === "numerica" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Unidad (opcional)</label>
          <input
            type="text"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            placeholder="ej. km, páginas, minutos"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancelar</button>
        <button type="submit" disabled={!topico.trim()} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">Agregar</button>
      </div>
    </form>
  );
}

export default function HabitosPage() {
  const { habitos, registros, agregarHabito, eliminarHabito, registrar, getRegistro, getHistorial, getRacha } = useHabitos();
  const [modalOpen, setModalOpen] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const hoy = fechaHoy();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Hábitos</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors mt-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        {registros.filter((r) => r.fecha === hoy && r.valor > 0).length} / {habitos.length} completados hoy
      </p>

      {habitos.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Sin hábitos"
          description="Agrega tu primer hábito para empezar a rastrear"
        />
      ) : (
        <div className="space-y-3">
          {habitos.map((h) => (
            <div key={h.id}>
              <div
                className="cursor-pointer"
                onClick={() => setExpandido(expandido === h.id ? null : h.id)}
              >
                <TarjetaHabito
                  habito={h}
                  registroHoy={getRegistro(h.id, hoy)}
                  racha={getRacha(h.id)}
                  onRegistrar={registrar}
                  onEliminar={eliminarHabito}
                />
              </div>
              {expandido === h.id && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4 mt-1">
                  <CalendarioHabito habito={h} historial={getHistorial(h.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo hábito">
        <FormHabito
          onSubmit={(datos) => { agregarHabito(datos); setModalOpen(false); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
