"use client";
import { useState } from "react";
import type { ClaseHorario, Materia } from "@/lib/types";
import type { GoogleEventoSemana } from "@/lib/hooks/useGoogleCalendarSemana";
import { DIAS_SEMANA, DIAS_SHORT, minutosDesdeMedianoche } from "@/lib/utils";
import EventoCalendarioModal, { type EventoCalendario } from "@/components/home/EventoCalendarioModal";

interface Props {
  clases: ClaseHorario[];
  materias: Materia[];
  googleEventos?: GoogleEventoSemana[];
  onRefetch?: () => void;
}

const HORA_INICIO = 7 * 60;
const HORA_FIN    = 21 * 60;
const TOTAL_MIN   = HORA_FIN - HORA_INICIO;
const HORAS       = Array.from({ length: 15 }, (_, i) => i + 7); // 7h–21h

export default function HorarioSemanal({ clases, materias, googleEventos = [], onRefetch }: Props) {
  const getMat = (id: string) => materias.find((m) => m.id === id);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Encabezado días — lunes a domingo */}
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: "2.5rem repeat(7, 1fr)" }}>
        <div />
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-l border-gray-100"
          >
            {DIAS_SHORT[dia]}
          </div>
        ))}
      </div>

      {/* Cuerpo */}
      <div className="relative" style={{ height: `${TOTAL_MIN * 1.2}px` }}>
        {/* Líneas de hora */}
        {HORAS.map((hora) => (
          <div
            key={hora}
            className="absolute left-0 right-0 border-t border-gray-50 flex items-start pointer-events-none"
            style={{ top: `${((hora * 60 - HORA_INICIO) / TOTAL_MIN) * 100}%` }}
          >
            <span className="w-10 text-right pr-2 text-[10px] text-gray-300 leading-none -mt-2 flex-shrink-0">
              {hora}h
            </span>
          </div>
        ))}

        {/* Columnas */}
        <div className="absolute left-10 right-0 top-0 bottom-0 grid" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {DIAS_SEMANA.map((dia) => {
            const clasesDelDia = clases
              .filter((c) => c.dia === dia)
              .sort((a, b) => minutosDesdeMedianoche(a.horaInicio) - minutosDesdeMedianoche(b.horaInicio));

            const eventosDelDia = googleEventos.filter((e) => e.dia === dia);

            return (
              <div key={dia} className="relative border-l border-gray-100">
                {/* Clases del app */}
                {clasesDelDia.map((clase) => {
                  const ini = minutosDesdeMedianoche(clase.horaInicio) - HORA_INICIO;
                  const dur = minutosDesdeMedianoche(clase.horaFin) - minutosDesdeMedianoche(clase.horaInicio);
                  const mat = getMat(clase.materiaId);
                  const top    = (ini / TOTAL_MIN) * 100;
                  const height = (dur / TOTAL_MIN) * 100;

                  return (
                    <div
                      key={clase.id}
                      className="absolute left-0.5 right-0.5 rounded overflow-hidden text-white"
                      style={{ top: `${top}%`, height: `${height}%`, backgroundColor: mat?.color ?? "#64748b" }}
                    >
                      <div className="p-1.5 h-full flex flex-col">
                        <p className="text-[10px] font-semibold leading-tight truncate opacity-90">
                          {mat?.nombre ?? "Clase"}
                        </p>
                        {dur >= 60 && (
                          <p className="text-[9px] opacity-60 leading-tight mt-0.5">{clase.horaInicio}</p>
                        )}
                        {clase.salon && dur >= 90 && (
                          <p className="text-[9px] opacity-50 leading-tight truncate">{clase.salon}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Eventos de Google Calendar */}
                {eventosDelDia.map((evento) => {
                  const ini = minutosDesdeMedianoche(evento.horaInicio) - HORA_INICIO;
                  const dur = minutosDesdeMedianoche(evento.horaFin) - minutosDesdeMedianoche(evento.horaInicio);
                  if (ini < 0 || dur <= 0) return null;
                  const top    = (ini / TOTAL_MIN) * 100;
                  const height = Math.max((dur / TOTAL_MIN) * 100, 2);

                  return (
                    <button
                      key={evento.id}
                      onClick={() => setEventoSeleccionado({
                        id: evento.id,
                        titulo: evento.titulo,
                        inicio: evento.inicioISO,
                        fin: evento.finISO,
                        todoElDia: false,
                      })}
                      className="absolute left-0.5 right-0.5 rounded overflow-hidden text-left hover:brightness-95 transition-all"
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        backgroundColor: "#e2e8f0",
                        borderLeft: "2px solid #94a3b8",
                      }}
                    >
                      <div className="px-1 pt-0.5 h-full flex flex-col">
                        <p className="text-[10px] font-medium leading-tight truncate text-slate-600">
                          {evento.titulo}
                        </p>
                        {dur >= 60 && (
                          <p className="text-[9px] text-slate-400 leading-tight">{evento.horaInicio}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <EventoCalendarioModal
        evento={eventoSeleccionado}
        onClose={() => setEventoSeleccionado(null)}
        onRefetch={() => { onRefetch?.(); setEventoSeleccionado(null); }}
      />
    </div>
  );
}
