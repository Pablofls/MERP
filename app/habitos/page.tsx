"use client";
import { useState } from "react";
import { useHabitos } from "@/lib/hooks/useHabitos";
import TarjetaHabito from "@/components/habitos/TarjetaHabito";
import CalendarioHabitos from "@/components/habitos/CalendarioHabitos";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { fechaHoy, getHabitColor } from "@/lib/utils";
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
          placeholder="ej. Correr, Leer, Meditar"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de registro</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setTipoMedida("booleana")}
            className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${tipoMedida === "booleana" ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-200"}`}>
            Sí / No
          </button>
          <button type="button" onClick={() => setTipoMedida("numerica")}
            className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${tipoMedida === "numerica" ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-200"}`}>
            Cantidad
          </button>
        </div>
      </div>
      {tipoMedida === "numerica" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Unidad (opcional)</label>
          <input type="text" value={unidad} onChange={(e) => setUnidad(e.target.value)}
            placeholder="ej. km, páginas, minutos"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800" />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
        <button type="submit" disabled={!topico.trim()} className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-40 transition-colors">Agregar</button>
      </div>
    </form>
  );
}

export default function HabitosPage() {
  const { habitos, registros, agregarHabito, eliminarHabito, registrar, getRegistro, getRacha } = useHabitos();
  const [modalOpen, setModalOpen] = useState(false);
  const hoy = fechaHoy();
  const completadosHoy = registros.filter((r) => r.fecha === hoy && r.valor > 0).length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hábitos</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {completadosHoy} / {habitos.length} completados hoy
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-900 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo
        </button>
      </div>

      {habitos.length === 0 ? (
        <EmptyState title="Sin hábitos" description="Agrega tu primer hábito para empezar" />
      ) : (
        <>
          {/* Calendario principal */}
          <CalendarioHabitos habitos={habitos} registros={registros} />

          {/* Leyenda de colores */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
            {habitos.map((h) => (
              <div key={h.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getHabitColor(h.id) }} />
                <span className="text-xs text-gray-500">{h.topico}</span>
              </div>
            ))}
          </div>

          {/* Tarjetas de hábitos */}
          <div className="space-y-2">
            {habitos.map((h) => (
              <TarjetaHabito
                key={h.id}
                habito={h}
                registroHoy={getRegistro(h.id, hoy)}
                racha={getRacha(h.id)}
                onRegistrar={registrar}
                onEliminar={eliminarHabito}
              />
            ))}
          </div>
        </>
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
