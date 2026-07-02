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
    const nuevo = completadoHoy ? 0 : 1;
    onRegistrar(habito.id, hoy, nuevo);
  }

  function guardarNumerico(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(inputValor);
    if (isNaN(val) || val < 0) return;
    onRegistrar(habito.id, hoy, val);
    setEditandoValor(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{habito.topico}</h3>
          {habito.unidad && (
            <p className="text-xs text-gray-400 mt-0.5">en {habito.unidad}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {racha > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                🔥 {racha} {racha === 1 ? "día" : "días"}
              </span>
            )}
            {registroHoy && registroHoy.valor > 0 && habito.tipoMedida === "numerica" && (
              <span className="text-xs text-gray-500">
                Hoy: <strong>{registroHoy.valor} {habito.unidad}</strong>
              </span>
            )}
          </div>
        </div>

        {habito.tipoMedida === "booleana" ? (
          <button
            onClick={toggleBooleano}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
              completadoHoy
                ? "bg-emerald-100 text-emerald-600 scale-110"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {completadoHoy ? "✓" : "○"}
          </button>
        ) : editandoValor ? (
          <form onSubmit={guardarNumerico} className="flex gap-1">
            <input
              type="number"
              value={inputValor}
              onChange={(e) => setInputValor(e.target.value)}
              step="0.1"
              min="0"
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
            >
              ✓
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setInputValor(registroHoy?.valor?.toString() ?? "");
              setEditandoValor(true);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              completadoHoy
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {completadoHoy ? `${registroHoy?.valor} ${habito.unidad ?? ""}` : "Registrar"}
          </button>
        )}
      </div>

      <div className="flex justify-end mt-2">
        <button
          onClick={() => onEliminar(habito.id)}
          className="text-[10px] text-gray-300 hover:text-red-400 transition-colors"
        >
          Eliminar hábito
        </button>
      </div>
    </div>
  );
}
