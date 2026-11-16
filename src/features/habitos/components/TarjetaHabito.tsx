"use client";
import { useState } from "react";
import type { Habito, RegistroHabito } from "@/lib/types";
import { fechaHoy, getHabitColorByIndex } from "@/lib/utils";
import type { PeriodoHabito } from "@/features/habitos/periodo";

/** "mié 11" */
function diaCorto(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const dia = d.toLocaleDateString("es-MX", { weekday: "short", timeZone: "UTC" }).replace(".", "");
  return `${dia} ${d.getUTCDate()}`;
}

/** Texto del rango y de lo que falta para cerrar el periodo. */
function describirPeriodo(periodo: PeriodoHabito, hoy: string): { rango: string; estado: string | null } {
  if (periodo.progreso === 0 && periodo.racha === 0) {
    return { rango: `${periodo.dias} días desde tu primer registro`, estado: null };
  }
  const rango = `del ${diaCorto(periodo.inicio)} al ${diaCorto(periodo.fin)}`;
  if (periodo.cumplido) return { rango, estado: "✓ cumplido" };
  const quedan = Math.round((Date.parse(periodo.fin) - Date.parse(hoy)) / 86_400_000) + 1; // incluye hoy
  return { rango, estado: quedan <= 1 ? "último día" : `quedan ${quedan} días` };
}

function etiquetaRacha(habito: Habito, racha: number, dias?: number): string {
  const uno = racha === 1;
  if (habito.frecuencia !== "semanal") return uno ? "día seguido" : "días seguidos";
  if ((dias ?? 7) === 7) return uno ? "semana seguida" : "semanas seguidas";
  return uno ? "periodo seguido" : "periodos seguidos";
}

interface Props {
  habito: Habito;
  colorIndex: number;
  fecha: string;
  registroDia?: RegistroHabito;
  racha: number;
  periodo?: PeriodoHabito; // solo hábitos "cada N días"
  onRegistrar: (habitoId: string, fecha: string, valor: number) => void;
  onEditar: (habito: Habito) => void;
}

export default function TarjetaHabito({ habito, colorIndex, fecha, registroDia, racha, periodo, onRegistrar, onEditar }: Props) {
  const [inputValor, setInputValor] = useState(registroDia?.valor?.toString() ?? "");
  const [editandoValor, setEditandoValor] = useState(false);
  const hoy = fechaHoy();
  const esFuturo = fecha > hoy;
  const completadoDia = registroDia && registroDia.valor > 0;
  const color = getHabitColorByIndex(colorIndex);
  const info = periodo ? describirPeriodo(periodo, hoy) : null;
  const unidad = habito.unidad ? ` ${habito.unidad}` : "";

  function toggleBooleano() {
    if (esFuturo) return;
    onRegistrar(habito.id, fecha, completadoDia ? 0 : 1);
  }

  function guardarNumerico(e: React.FormEvent) {
    e.preventDefault();
    if (esFuturo) return;
    const val = parseFloat(inputValor);
    if (isNaN(val) || val < 0) return;
    onRegistrar(habito.id, fecha, val);
    setEditandoValor(false);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
                    <span className="text-xs text-gray-400">{etiquetaRacha(habito, racha, periodo?.dias)}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-300">Sin racha</span>
                )}
              </div>

              {/* Progreso del periodo — modo frecuencia (puntos; los registros de más también se ven) */}
              {periodo && info && !habito.metaCantidadSemanal && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: Math.max(periodo.meta, periodo.progreso) }, (_, i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: i < periodo.progreso ? color : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {periodo.progreso}/{periodo.meta} · {info.rango}
                  </span>
                  {info.estado && (
                    <span className="text-[10px] font-semibold ml-auto whitespace-nowrap" style={{ color }}>
                      {info.estado}
                    </span>
                  )}
                </div>
              )}

              {/* Progreso del periodo — modo acumulado (barra) */}
              {periodo && info && habito.metaCantidadSemanal && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-400">
                      {periodo.progreso}{unidad} / {periodo.meta}{unidad} · {info.rango}
                    </span>
                    <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color }}>
                      {periodo.cumplido
                        ? info.estado
                        : [`${Math.min(100, Math.round((periodo.progreso / periodo.meta) * 100))}%`, info.estado]
                            .filter(Boolean)
                            .join(" · ")}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (periodo.progreso / periodo.meta) * 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Control de registro */}
            {esFuturo ? null : habito.tipoMedida === "booleana" ? (
              <button
                onClick={toggleBooleano}
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  backgroundColor: completadoDia ? color : "transparent",
                  borderColor: completadoDia ? color : "#d1d5db",
                }}
              >
                {completadoDia && (
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
                onClick={() => { setInputValor(registroDia?.valor?.toString() ?? ""); setEditandoValor(true); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-colors flex-shrink-0"
                style={{
                  color: completadoDia ? color : "#9ca3af",
                  borderColor: completadoDia ? color : "#e5e7eb",
                  backgroundColor: completadoDia ? `${color}15` : "transparent",
                }}
              >
                {completadoDia ? `${registroDia?.valor} ${habito.unidad ?? ""}` : "Registrar"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-2 flex justify-end">
        <button onClick={() => onEditar(habito)} className="text-[10px] text-gray-300 hover:text-blue-500 transition-colors">
          Editar
        </button>
      </div>
    </div>
  );
}
