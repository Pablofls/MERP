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
    setOpen(false); setSalon("");
  }

  const getMat = (id: string) => materias.find((m) => m.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clases</h3>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar clase
        </button>
      </div>

      {clases.length === 0 ? (
        <EmptyState title="Sin clases registradas" />
      ) : (
        <div className="space-y-1">
          {diasConClases.map((d) => {
            const clasesDelDia = clases.filter((c) => c.dia === d);
            if (!clasesDelDia.length) return null;
            return (
              <div key={d}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-2 pb-1">
                  {DIAS_SHORT[d]}
                </p>
                {clasesDelDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)).map((clase) => {
                  const mat = getMat(clase.materiaId);
                  return (
                    <div key={clase.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: mat?.color ?? "#94a3b8" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{mat?.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {clase.horaInicio} – {clase.horaFin}{clase.salon ? ` · ${clase.salon}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => onEliminar(clase.id)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva clase">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Materia</label>
            <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white">
              {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dia</label>
            <div className="flex gap-1.5 flex-wrap">
              {diasConClases.map((d) => (
                <button key={d} type="button" onClick={() => setDia(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${dia === d ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {DIAS_SHORT[d]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inicio</label>
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fin</label>
              <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Salon (opcional)</label>
            <input type="text" value={salon} onChange={(e) => setSalon(e.target.value)} placeholder="ej. A-201" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 transition-colors">Agregar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
