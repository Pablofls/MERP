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
  const [frecuencia, setFrecuencia] = useState<"diaria" | "semanal">("diaria");
  const [metaSemanal, setMetaSemanal] = useState(3);
  const [modoMeta, setModoMeta] = useState<"frecuencia" | "acumulado">("frecuencia");
  const [metaCantidadSemanal, setMetaCantidadSemanal] = useState("");

  const esSemanalAcumulado = frecuencia === "semanal" && tipoMedida === "numerica" && modoMeta === "acumulado";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topico.trim()) return;
    if (esSemanalAcumulado && !metaCantidadSemanal) return;
    onSubmit({
      topico: topico.trim(),
      tipoMedida,
      unidad: tipoMedida === "numerica" ? (unidad.trim() || undefined) : undefined,
      frecuencia,
      metaSemanal: frecuencia === "semanal" && !esSemanalAcumulado ? metaSemanal : undefined,
      metaCantidadSemanal: esSemanalAcumulado ? Number(metaCantidadSemanal) : undefined,
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
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
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
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Frecuencia</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setFrecuencia("diaria")}
            className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${frecuencia === "diaria" ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-200"}`}>
            Diaria
          </button>
          <button type="button" onClick={() => setFrecuencia("semanal")}
            className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${frecuencia === "semanal" ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-200"}`}>
            Semanal
          </button>
        </div>
      </div>
      {frecuencia === "semanal" && tipoMedida === "numerica" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Meta semanal</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setModoMeta("frecuencia")}
              className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${modoMeta === "frecuencia" ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-200"}`}>
              X veces
            </button>
            <button type="button" onClick={() => setModoMeta("acumulado")}
              className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${modoMeta === "acumulado" ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-200"}`}>
              Total acumulado
            </button>
          </div>
        </div>
      )}
      {frecuencia === "semanal" && (tipoMedida === "booleana" || modoMeta === "frecuencia") && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Veces por semana
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={7}
              value={metaSemanal}
              onChange={(e) => setMetaSemanal(Number(e.target.value))}
              className="flex-1 accent-blue-900"
            />
            <span className="text-sm font-semibold text-blue-900 w-6 text-center">{metaSemanal}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
            <span>1</span><span>7</span>
          </div>
        </div>
      )}
      {esSemanalAcumulado && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Meta semanal {unidad ? `(${unidad})` : ""}
          </label>
          <input
            type="number"
            min={1}
            value={metaCantidadSemanal}
            onChange={(e) => setMetaCantidadSemanal(e.target.value)}
            placeholder={`ej. 70${unidad ? " " + unidad : ""}`}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
        <button type="submit" disabled={!topico.trim() || (esSemanalAcumulado && !metaCantidadSemanal)} className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-40 transition-colors">Agregar</button>
      </div>
    </form>
  );
}

export default function HabitosPage() {
  const { habitos, registros, agregarHabito, eliminarHabito, registrar, getRegistro, getRacha, getConteoSemana, getRachaSemanal, getSumaSemana, getRachaSemanalCantidad } = useHabitos();
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
          className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
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
                racha={
                  h.frecuencia === "semanal" && h.metaCantidadSemanal
                    ? getRachaSemanalCantidad(h.id, h.metaCantidadSemanal)
                    : h.frecuencia === "semanal"
                    ? getRachaSemanal(h.id, h.metaSemanal ?? 1)
                    : getRacha(h.id)
                }
                conteoSemana={h.frecuencia === "semanal" && !h.metaCantidadSemanal ? getConteoSemana(h.id) : undefined}
                sumaSemana={h.frecuencia === "semanal" && h.metaCantidadSemanal ? getSumaSemana(h.id) : undefined}
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
