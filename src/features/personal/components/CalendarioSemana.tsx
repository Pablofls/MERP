"use client";
import { useState } from "react";
import type { Pendiente } from "@/lib/types";
import { cn, fechaHoy } from "@/lib/utils";

function getSemanaConOffset(offset: number): Date[] {
  const hoy = new Date();
  const lunes = new Date(hoy);
  const dow = (hoy.getDay() + 6) % 7;
  lunes.setDate(hoy.getDate() - dow + offset * 7);
  lunes.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

function semanaLabel(semana: Date[]): string {
  const ini = semana[0].toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const fin = semana[6].toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  return `${ini} – ${fin}`;
}

const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

/** Tira semanal de pendientes personales. `diaInicial` abre un día ya seleccionado (vista previa). */
export default function CalendarioSemana({ pendientes, diaInicial = null }: { pendientes: Pendiente[]; diaInicial?: string | null }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(diaInicial);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const hoy = fechaHoy();
  const semana = getSemanaConOffset(semanaOffset);

  function isoFecha(d: Date) {
    return d.toISOString().split("T")[0];
  }

  function pendientesDelDia(fecha: string) {
    return pendientes.filter((p) => p.fechaLimite === fecha && !p.completado);
  }

  const pendientesDia = diaSeleccionado ? pendientesDelDia(diaSeleccionado) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Navegación de semana */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <button
          onClick={() => { setSemanaOffset((o) => o - 1); setDiaSeleccionado(null); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-xs font-semibold text-gray-700 capitalize">{semanaLabel(semana)}</span>
        <button
          onClick={() => { setSemanaOffset((o) => o + 1); setDiaSeleccionado(null); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Tira de días */}
      <div className="grid grid-cols-7 divide-x divide-gray-100">
        {semana.map((dia, i) => {
          const iso = isoFecha(dia);
          const esHoy = iso === hoy;
          const tiene = pendientesDelDia(iso).length > 0;
          const activo = diaSeleccionado === iso;
          return (
            <button
              key={iso}
              onClick={() => setDiaSeleccionado(activo ? null : iso)}
              className={cn(
                "flex flex-col items-center py-3 transition-colors",
                activo ? "bg-blue-900 text-white" : "hover:bg-gray-50"
              )}
            >
              <span className={cn("text-[10px] font-semibold uppercase tracking-wider", activo ? "text-slate-400" : "text-gray-400")}>
                {DIAS_CORTOS[i]}
              </span>
              <span className={cn(
                "text-sm font-semibold mt-1 w-6 h-6 flex items-center justify-center rounded-full",
                activo ? "text-white" : esHoy ? "bg-blue-900 text-white" : "text-gray-700"
              )}>
                {dia.getDate()}
              </span>
              {tiene && (
                <span className={cn("w-1 h-1 rounded-full mt-1", activo ? "bg-white" : "bg-blue-400")} />
              )}
            </button>
          );
        })}
      </div>

      {/* Pendientes del dia seleccionado */}
      {diaSeleccionado && (
        <div className="border-t border-gray-100 px-4 py-3">
          {pendientesDia.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">Sin pendientes este dia</p>
          ) : (
            <ul className="space-y-1.5">
              {pendientesDia.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{p.titulo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
