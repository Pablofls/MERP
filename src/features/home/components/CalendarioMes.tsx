"use client";
import { cn } from "@/lib/utils";
import { isoLocal } from "@/features/home/lib/agendaDia";

export interface ConteoPendientes {
  total: number;
  vencidos: number;
}

interface Props {
  mesRef: Date;
  onCambiarMes: (mes: Date) => void;
  fechaSel: string;
  hoy: string;
  onSeleccionar: (fecha: string) => void;
  coloresEventos: Map<string, string[]>; // color de cada evento del día
  conteoPendientes: Map<string, ConteoPendientes>;
}

const DIAS_HEADER = ["L", "M", "M", "J", "V", "S", "D"];
const MAX_PUNTOS = 4;

export default function CalendarioMes({
  mesRef, onCambiarMes, fechaSel, hoy, onSeleccionar, coloresEventos, conteoPendientes,
}: Props) {
  const año = mesRef.getFullYear();
  const mes = mesRef.getMonth();
  const primerDia = new Date(año, mes, 1);
  const diasMes = new Date(año, mes + 1, 0).getDate();
  const offsetInicio = (primerDia.getDay() + 6) % 7; // lunes primero

  const celdas: (string | null)[] = Array(offsetInicio).fill(null);
  for (let d = 1; d <= diasMes; d++) celdas.push(isoLocal(new Date(año, mes, d)));
  while (celdas.length % 7 !== 0) celdas.push(null);

  const nombreMes = primerDia.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  function irAHoy() {
    const [y, m] = hoy.split("-").map(Number);
    onCambiarMes(new Date(y, m - 1, 1));
    onSeleccionar(hoy);
  }

  return (
    <section
      data-tutorial-id="calendario-mes"
      className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 flex flex-col lg:h-[calc(100dvh-6.5rem)]"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">{nombreMes}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={irAHoy}
            className="text-xs font-medium text-gray-600 border border-gray-200 rounded-md px-2.5 py-1 mr-1 hover:bg-gray-50 transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => onCambiarMes(new Date(año, mes - 1, 1))}
            aria-label="Mes anterior"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => onCambiarMes(new Date(año, mes + 1, 1))}
            aria-label="Mes siguiente"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1 flex-shrink-0">
        {DIAS_HEADER.map((d, i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 flex-1 min-h-0 border-t border-l border-gray-200 rounded-lg overflow-hidden"
        style={{ gridTemplateRows: `repeat(${celdas.length / 7}, minmax(0, 1fr))` }}
      >
        {celdas.map((fecha, i) => {
          if (!fecha) return <div key={`v-${i}`} className="border-r border-b border-gray-200 bg-gray-50/60" />;
          const esHoy = fecha === hoy;
          const esSel = fecha === fechaSel;
          const colores = coloresEventos.get(fecha) ?? [];
          const eventos = colores.length;
          const pend = conteoPendientes.get(fecha);
          const dia = Number(fecha.slice(8));

          return (
            <button
              key={fecha}
              onClick={() => onSeleccionar(fecha)}
              aria-label={`${dia}: ${eventos} eventos, ${pend?.total ?? 0} pendientes`}
              aria-pressed={esSel}
              className={cn(
                "flex flex-col items-center gap-1 pt-1.5 pb-1 min-h-16 sm:min-h-20 lg:min-h-0 overflow-hidden border-r border-b border-gray-200 transition-colors",
                esSel && !esHoy ? "bg-blue-50" : "bg-white hover:bg-gray-50"
              )}
            >
              <span
                className={cn(
                  "text-sm lg:text-base font-medium w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-full",
                  esHoy ? "bg-blue-900 text-white" : esSel ? "text-blue-900 ring-2 ring-blue-300" : "text-gray-700"
                )}
              >
                {dia}
              </span>

              {/* Eventos: puntitos */}
              <span className="flex items-center gap-[3px] h-2">
                {colores.slice(0, MAX_PUNTOS).map((color, j) => (
                  <span key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                ))}
                {eventos > MAX_PUNTOS && (
                  <span className="text-[10px] leading-none font-semibold text-gray-500">+</span>
                )}
              </span>

              {/* Pendientes: círculo con número */}
              {pend && pend.total > 0 && (
                <span
                  className={cn(
                    "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold leading-none flex items-center justify-center",
                    pend.vencidos > 0 ? "bg-red-500 text-white" : "bg-amber-400 text-amber-950"
                  )}
                >
                  {pend.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="flex gap-[2px]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          Eventos (color de la materia)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-amber-950 text-[9px] font-semibold flex items-center justify-center">n</span>
          Pendientes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500" /> Vencidos
        </span>
      </div>
    </section>
  );
}
