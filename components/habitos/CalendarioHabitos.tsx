"use client";
import { useState } from "react";
import type { Habito, RegistroHabito } from "@/lib/types";
import { getHabitColor } from "@/lib/utils";

interface Props {
  habitos: Habito[];
  registros: RegistroHabito[];
}

const DIAS_HEADER = ["L", "M", "X", "J", "V", "S", "D"];

function isoFecha(date: Date): string {
  return date.toISOString().split("T")[0];
}

function inicioSemana(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarioHabitos({ habitos, registros }: Props) {
  const [vista, setVista] = useState<"mensual" | "semanal">("mensual");
  const [referencia, setReferencia] = useState(new Date());
  const hoyStr = isoFecha(new Date());

  function registradoEn(habitoId: string, fecha: string): boolean {
    return registros.some((r) => r.habitoId === habitoId && r.fecha === fecha && r.valor > 0);
  }

  // ── VISTA MENSUAL ──────────────────────────────────────────────
  function renderMensual() {
    const año = referencia.getFullYear();
    const mes = referencia.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const offsetInicio = (primerDia.getDay() + 6) % 7; // Lunes = 0

    const celdas: (string | null)[] = [
      ...Array(offsetInicio).fill(null),
    ];
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      celdas.push(isoFecha(new Date(año, mes, d)));
    }
    while (celdas.length % 7 !== 0) celdas.push(null);

    const nombreMes = primerDia.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

    return (
      <div>
        {/* Navegación */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setReferencia(new Date(año, mes - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-700 capitalize">{nombreMes}</span>
          <button
            onClick={() => setReferencia(new Date(año, mes + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            disabled={new Date(año, mes + 1, 1) > new Date()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Headers días */}
        <div className="grid grid-cols-7 mb-1">
          {DIAS_HEADER.map((d) => (
            <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-y-1">
          {celdas.map((fecha, i) => {
            if (!fecha) return <div key={`e-${i}`} />;
            const esHoy = fecha === hoyStr;
            const esFuturo = fecha > hoyStr;
            const completados = habitos.filter((h) => registradoEn(h.id, fecha));

            return (
              <div key={fecha} className="flex flex-col items-center gap-0.5 py-1">
                <span className={`text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full
                  ${esHoy ? "bg-blue-900 text-white" : "text-gray-500"}`}>
                  {parseInt(fecha.split("-")[2])}
                </span>
                <div className="flex flex-wrap justify-center gap-[2px] min-h-[8px]">
                  {!esFuturo && completados.map((h) => (
                    <span
                      key={h.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getHabitColor(h.id) }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── VISTA SEMANAL ──────────────────────────────────────────────
  function renderSemanal() {
    const lunes = inicioSemana(referencia);
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });

    const semanaLabel = `${dias[0].getDate()} ${dias[0].toLocaleDateString("es-MX", { month: "short" })} — ${dias[6].getDate()} ${dias[6].toLocaleDateString("es-MX", { month: "short", year: "numeric" })}`;

    function prevSemana() {
      const d = new Date(referencia);
      d.setDate(d.getDate() - 7);
      setReferencia(d);
    }
    function nextSemana() {
      const d = new Date(referencia);
      d.setDate(d.getDate() + 7);
      if (d <= new Date()) setReferencia(d);
    }

    return (
      <div>
        {/* Navegación */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevSemana} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-700">{semanaLabel}</span>
          <button onClick={nextSemana} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Tabla días × hábitos */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-gray-400 font-medium pb-2 pr-2 w-20">Hábito</th>
                {dias.map((d) => {
                  const esHoy = isoFecha(d) === hoyStr;
                  return (
                    <th key={isoFecha(d)} className="text-center pb-2 px-0.5">
                      <div className={`text-[10px] font-medium ${esHoy ? "text-blue-900" : "text-gray-400"}`}>
                        {DIAS_HEADER[(d.getDay() + 6) % 7]}
                      </div>
                      <div className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full mx-auto ${esHoy ? "bg-blue-900 text-white" : "text-gray-600"}`}>
                        {d.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {habitos.map((h) => {
                const color = getHabitColor(h.id);
                return (
                  <tr key={h.id}>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-gray-700 truncate max-w-[60px]">{h.topico}</span>
                      </div>
                    </td>
                    {dias.map((d) => {
                      const fecha = isoFecha(d);
                      const hecho = registradoEn(h.id, fecha);
                      const futuro = fecha > hoyStr;
                      return (
                        <td key={fecha} className="text-center py-2 px-0.5">
                          <span
                            className="w-6 h-6 rounded-md mx-auto flex items-center justify-center"
                            style={{
                              backgroundColor: hecho ? color : futuro ? "transparent" : "#f3f4f6",
                            }}
                          >
                            {hecho && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {(["mensual", "semanal"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
              vista === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {vista === "mensual" ? renderMensual() : renderSemanal()}
    </div>
  );
}
