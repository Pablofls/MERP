"use client";
import { useState } from "react";
import type { ClaseHorario, Materia, DiaSemana } from "@/lib/types";
import { DIAS_SEMANA, DIAS_SHORT } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";

interface Props {
  clases: ClaseHorario[];
  materias: Materia[];
  onAgregar: (datos: Omit<ClaseHorario, "id">) => void;
  onEliminar: (id: string) => void;
}

export default function GestorClases({ clases, materias, onAgregar, onEliminar }: Props) {
  const [open, setOpen] = useState(false);
  const [materiaId, setMateriaId] = useState(materias[0]?.id ?? "");
  const [dia, setDia] = useState<DiaSemana>("lunes");
  const [horaInicio, setHoraInicio] = useState("07:00");
  const [horaFin, setHoraFin] = useState("09:00");
  const [salon, setSalon] = useState("");

  const diasConClases = DIAS_SEMANA.slice(0, 5);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!materiaId) return;
    onAgregar({ materiaId, dia, horaInicio, horaFin, salon: salon.trim() || undefined });
    setOpen(false);
    setSalon("");
  }

  const getMat = (id: string) => materias.find((m) => m.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Clases</h3>
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          + Agregar clase
        </button>
      </div>

      {clases.length === 0 ? (
        <EmptyState icon="📅" title="Sin clases registradas" />
      ) : (
        <div className="space-y-1">
          {diasConClases.map((dia) => {
            const clasesDelDia = clases.filter((c) => c.dia === dia);
            if (clasesDelDia.length === 0) return null;
            return (
              <div key={dia}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">
                  {DIAS_SHORT[dia]}
                </p>
                <div className="space-y-1">
                  {clasesDelDia
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    .map((clase) => {
                      const mat = getMat(clase.materiaId);
                      return (
                        <div
                          key={clase.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
                        >
                          <div
                            className="w-2 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: mat?.color ?? "#94a3b8" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{mat?.nombre}</p>
                            <p className="text-xs text-gray-400">
                              {clase.horaInicio} – {clase.horaFin}
                              {clase.salon ? ` · ${clase.salon}` : ""}
                            </p>
                          </div>
                          <button
                            onClick={() => onEliminar(clase.id)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva clase">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Materia</label>
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Día</label>
            <div className="flex gap-1.5 flex-wrap">
              {diasConClases.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDia(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    dia === d ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {DIAS_SHORT[d]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fin</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Salón (opcional)</label>
            <input
              type="text"
              value={salon}
              onChange={(e) => setSalon(e.target.value)}
              placeholder="ej. A-201"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancelar</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Agregar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
