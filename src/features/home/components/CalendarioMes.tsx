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
  conteoEventos: Map<string, number>;
  conteoPendientes: Map<string, ConteoPendientes>;
}

const DIAS_HEADER = ["L", "M", "M", "J", "V", "S", "D"];
const MAX_PUNTOS = 3;

export default function CalendarioMes({
  mesRef, onCambiarMes, fechaSel, hoy, onSeleccionar, conteoEventos, conteoPendientes,
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
    <section data-tutorial-id="calendario-mes" className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
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

      <div className="grid grid-cols-7 mb-1">
        {DIAS_HEADER.map((d, i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 lg:gap-y-1">
        {celdas.map((fecha, i) => {
          if (!fecha) return <div key={`v-${i}`} />;
          const esHoy = fecha === hoy;
          const esSel = fecha === fechaSel;
          const eventos = conteoEventos.get(fecha) ?? 0;
          const pend = conteoPendientes.get(fecha);
          const dia = Number(fecha.slice(8));

          return (
            <button
              key={fecha}
              onClick={() => onSeleccionar(fecha)}
              aria-label={`${dia}: ${eventos} eventos, ${pend?.total ?? 0} pendientes`}
              aria-pressed={esSel}
              className={cn(
                "flex flex-col items-center gap-1 pt-1.5 pb-1 h-16 sm:h-20 lg:h-24 rounded-lg transition-colors",
                esSel && !esHoy ? "bg-blue-50" : "hover:bg-gray-50"
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
                {Array.from({ length: Math.min(eventos, MAX_PUNTOS) }).map((_, j) => (
                  <span key={j} className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                ))}
                {eventos > MAX_PUNTOS && (
                  <span className="text-[10px] leading-none font-semibold text-sky-600">+</span>
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

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Eventos
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
