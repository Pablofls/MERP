"use client";
import { useState } from "react";
import type { Habito, RegistroHabito } from "@/lib/types";
import { fechaHoy } from "@/lib/utils";

interface Props {
  habito: Habito;
  registroHoy?: RegistroHabito;
  racha: number;
  onRegistrar: (habitoId: string, fecha: string, valor: number) => void;
  onEliminar: (id: string) => void;
}

export default function TarjetaHabito({ habito, registroHoy, racha, onRegistrar, onEliminar }: Props) {
  const [inputValor, setInputValor] = useState(registroHoy?.valor?.toString() ?? "");
  const [editandoValor, setEditandoValor] = useState(false);
  const hoy = fechaHoy();
  const completadoHoy = registroHoy && registroHoy.valor > 0;

  function toggleBooleano() {
    onRegistrar(habito.id, hoy, completadoHoy ? 0 : 1);
  }

  function guardarNumerico(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(inputValor);
    if (isNaN(val) || val < 0) return;
    onRegistrar(habito.id, hoy, val);
    setEditandoValor(false);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{habito.topico}</h3>
          <div className="flex items-center gap-3 mt-1">
            {habito.unidad && (
              <span className="text-xs text-gray-400">{habito.unidad}</span>
            )}
            {racha > 0 && (
              <span className="text-xs text-blue-800 font-medium">
                {racha} {racha === 1 ? "dia" : "dias"} consecutivos
              </span>
            )}
          </div>
        </div>

        {habito.tipoMedida === "booleana" ? (
          <button
            onClick={toggleBooleano}
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
              completadoHoy
                ? "bg-blue-900 border-blue-900"
                : "border-gray-300 hover:border-blue-700"
            }`}
          >
            {completadoHoy && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        ) : editandoValor ? (
          <form onSubmit={guardarNumerico} className="flex gap-1.5 flex-shrink-0">
            <input
              type="number"
              value={inputValor}
              onChange={(e) => setInputValor(e.target.value)}
              step="0.1"
              min="0"
              className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-800"
              autoFocus
            />
            <button type="submit" className="px-3 py-1.5 bg-blue-900 text-white text-xs rounded hover:bg-slate-900 transition-colors">
              OK
            </button>
          </form>
        ) : (
          <button
            onClick={() => { setInputValor(registroHoy?.valor?.toString() ?? ""); setEditandoValor(true); }}
            className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors flex-shrink-0 ${
              completadoHoy
                ? "bg-blue-50 text-blue-900 border-blue-200"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {completadoHoy ? `${registroHoy?.valor} ${habito.unidad ?? ""}` : "Registrar"}
          </button>
        )}
      </div>

      <div className="flex justify-end mt-2">
        <button onClick={() => onEliminar(habito.id)} className="text-[10px] text-gray-300 hover:text-red-400 transition-colors">
          Eliminar
        </button>
      </div>
    </div>
  );
}
