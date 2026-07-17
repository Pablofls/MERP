"use client";
import { useState, useRef, useEffect } from "react";
import type { ClaseHorario, Materia } from "@/lib/types";
import { useGoogleCalendarSemana } from "@/lib/hooks/useGoogleCalendarSemana";
import { DIAS_SEMANA, DIAS_SHORT, minutosDesdeMedianoche, fechaHoy, cn } from "@/lib/utils";
import EventoCalendarioModal, { type EventoCalendario } from "@/components/home/EventoCalendarioModal";
import CrearEventoModal from "@/components/home/CrearEventoModal";

interface Props {
  clases: ClaseHorario[];
  materias: Materia[];
}

const HORA_INICIO = 0;
const HORA_FIN    = 24 * 60;
const TOTAL_MIN   = HORA_FIN - HORA_INICIO;
const PX_POR_MIN  = 1.5;
const ALTURA_TOTAL = TOTAL_MIN * PX_POR_MIN; // 2160px
const HORAS = Array.from({ length: 24 }, (_, i) => i); // 0h–23h

function getLunesConOffset(semanaOffset: number): Date {
  const hoy = new Date();
  const dow = (hoy.getDay() + 6) % 7;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - dow + semanaOffset * 7);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function semanaLabel(lunes: Date): string {
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const opciones: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${lunes.toLocaleDateString("es-MX", opciones)} – ${domingo.toLocaleDateString("es-MX", { ...opciones, year: "numeric" })}`;
}

function getMinutosAhora() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function HorarioSemanal({ clases, materias }: Props) {
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [diasVisibles, setDiasVisibles] = useState<number>(() => {
    if (typeof window === "undefined") return 3;
    const saved = localStorage.getItem("escolar_diasVisibles");
    const n = saved ? parseInt(saved, 10) : 3;
    return [3, 5, 7].includes(n) ? n : 3;
  });
  const [modalCrear, setModalCrear] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);
  const [minutosAhora, setMinutosAhora] = useState(getMinutosAhora);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { eventos: googleEventos, refetch } = useGoogleCalendarSemana(semanaOffset);

  // Persist view preference
  useEffect(() => {
    localStorage.setItem("escolar_diasVisibles", String(diasVisibles));
  }, [diasVisibles]);

  // Update current time line every minute
  useEffect(() => {
    const id = setInterval(() => setMinutosAhora(getMinutosAhora()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to 7am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * 60 * PX_POR_MIN;
    }
  }, []);

  const getMat = (id: string) => materias.find((m) => m.id === id);
  const hoy = fechaHoy();
  const lunes = getLunesConOffset(semanaOffset);

  // Build map: DiaSemana index → Date for the selected week
  const fechasDia = DIAS_SEMANA.map((_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });

  // For <7 days: on current week start from today, on other weeks start from Monday
  const todayWeekIdx = (new Date().getDay() + 6) % 7;
  const startIdx = diasVisibles < 7
    ? (semanaOffset === 0 ? Math.min(todayWeekIdx, 7 - diasVisibles) : 0)
    : 0;
  const diasSlice = DIAS_SEMANA.slice(startIdx, startIdx + diasVisibles);
  const fechasDiaSlice = fechasDia.slice(startIdx, startIdx + diasVisibles);

  // Default create date: today if in current week, else Monday
  const fechaDefault = semanaOffset === 0
    ? hoy
    : lunes.toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Barra de navegación */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <button
            onClick={() => setSemanaOffset((o) => o - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-700 capitalize text-center truncate">
            {semanaLabel(lunes)}
          </span>
          <button
            onClick={() => setSemanaOffset((o) => o + 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex rounded-md border border-gray-200 divide-x divide-gray-200 overflow-hidden">
            {[3, 5, 7].map((n) => (
              <button
                key={n}
                onClick={() => setDiasVisibles(n)}
                className={cn("px-2 py-1 text-xs font-medium transition-colors", diasVisibles === n ? "bg-blue-900 text-white" : "text-gray-500 hover:bg-gray-50")}
              >
                {n}d
              </button>
            ))}
          </div>
          <button
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-1 bg-blue-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Evento
          </button>
        </div>
      </div>

      {/* Encabezado días */}
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `2.5rem repeat(${diasVisibles}, 1fr)` }}>
        <div />
        {diasSlice.map((dia, i) => {
          const fechaDia = fechasDiaSlice[i];
          const esHoy = fechaDia.toISOString().split("T")[0] === hoy;
          return (
            <div
              key={dia}
              className="py-2 text-center border-l border-gray-100"
            >
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${esHoy ? "text-blue-900" : "text-gray-400"}`}>
                {DIAS_SHORT[dia]}
              </p>
              <p className={`text-xs font-bold mt-0.5 ${esHoy ? "text-blue-900" : "text-gray-400"}`}>
                {fechaDia.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Cuerpo con scroll */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ height: "460px" }}>
        <div className="relative" style={{ height: `${ALTURA_TOTAL}px` }}>
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

          {/* Línea de hora actual */}
          {semanaOffset === 0 && diasSlice.some((dia) => {
            const idx = DIAS_SEMANA.indexOf(dia);
            return fechasDia[idx]?.toISOString().split("T")[0] === hoy;
          }) && (
            <div
              className="absolute left-10 right-0 pointer-events-none z-10 flex items-center"
              style={{ top: `${(minutosAhora / TOTAL_MIN) * 100}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
              <div className="flex-1 border-t border-red-500" />
            </div>
          )}

          {/* Columnas */}
          <div className="absolute left-10 right-0 top-0 bottom-0 grid" style={{ gridTemplateColumns: `repeat(${diasVisibles}, 1fr)` }}>
            {diasSlice.map((dia) => {
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
                          {dur >= 45 && (
                            <p className="text-[9px] opacity-60 leading-tight mt-0.5">{clase.horaInicio}</p>
                          )}
                          {clase.salon && dur >= 75 && (
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
                    const height = Math.max((dur / TOTAL_MIN) * 100, 1.5);

                    return (
                      <button
                        key={evento.id}
                        onClick={() => setEventoSeleccionado({
                          id: evento.id,
                          titulo: evento.titulo,
                          inicio: evento.inicioISO,
                          fin: evento.finISO,
                          todoElDia: false,
                          recurringEventId: evento.recurringEventId,
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
                          {dur >= 45 && (
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
      </div>

      <EventoCalendarioModal
        evento={eventoSeleccionado}
        onClose={() => setEventoSeleccionado(null)}
        onRefetch={() => { refetch(); setEventoSeleccionado(null); }}
      />

      <CrearEventoModal
        open={modalCrear}
        fechaDefault={fechaDefault}
        onClose={() => setModalCrear(false)}
        onCreado={() => { refetch(); }}
      />
    </div>
  );
}
