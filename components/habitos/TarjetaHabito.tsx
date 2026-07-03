"use client";
import { useState } from "react";
import type { Habito, RegistroHabito } from "@/lib/types";
import { fechaHoy, getHabitColor } from "@/lib/utils";

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
  const color = getHabitColor(habito.id);

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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Barra de color en el borde izquierdo */}
      <div className="flex">
        <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ backgroundColor: color }} />

        <div className="flex-1 px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{habito.topico}</h3>
                {habito.unidad && (
                  <span className="text-xs text-gray-400">· {habito.unidad}</span>
                )}
              </div>

              {/* Racha */}
              <div className="flex items-center gap-2 mt-1">
                {racha > 0 ? (
                  <>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color})`,
                        boxShadow: `0 1px 3px ${color}66`,
                      }}
                    >
                      <span className="text-[10px] font-black text-white leading-none tracking-tight">
                        {racha > 99 ? "99+" : racha}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {racha === 1 ? "día" : "días"} seguidos
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-300">Sin racha</span>
                )}
              </div>
            </div>

            {/* Control de registro */}
            {habito.tipoMedida === "booleana" ? (
              <button
                onClick={toggleBooleano}
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  backgroundColor: completadoHoy ? color : "transparent",
                  borderColor: completadoHoy ? color : "#d1d5db",
                }}
              >
                {completadoHoy && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                  className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": color } as React.CSSProperties}
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-white text-xs rounded-lg transition-colors"
                  style={{ backgroundColor: color }}
                >
                  OK
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setInputValor(registroHoy?.valor?.toString() ?? ""); setEditandoValor(true); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-colors flex-shrink-0"
                style={{
                  color: completadoHoy ? color : "#9ca3af",
                  borderColor: completadoHoy ? color : "#e5e7eb",
                  backgroundColor: completadoHoy ? `${color}15` : "transparent",
                }}
              >
                {completadoHoy ? `${registroHoy?.valor} ${habito.unidad ?? ""}` : "Registrar"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-2 flex justify-end">
        <button onClick={() => onEliminar(habito.id)} className="text-[10px] text-gray-300 hover:text-red-400 transition-colors">
          Eliminar
        </button>
      </div>
    </div>
  );
}
