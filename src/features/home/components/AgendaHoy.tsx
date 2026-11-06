"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { ClaseHorario, Materia } from "@/lib/types";
import EmptyState from "@/components/ui/EmptyState";
import type { EventoCalendario } from "@/features/home/components/EventoCalendarioModal";
import { construirAgendaDia, eventosDelDia, fechaDeIso, sumarDias, type EventoGoogle } from "@/features/home/lib/agendaDia";
const EventoCalendarioModal = dynamic(() => import("@/features/home/components/EventoCalendarioModal"), { ssr: false });
const CrearEventoModal = dynamic(() => import("@/features/home/components/CrearEventoModal"), { ssr: false });

interface Props {
  fecha: string; // YYYY-MM-DD
  hoy: string;
  onCambiarFecha: (fecha: string) => void;
  clases: ClaseHorario[];
  materias: Materia[];
  eventosGoogle: EventoGoogle[]; // eventos del mes; aquí se filtran por día
  onRefetch: () => void;
}

function getLabelDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, -1)) return "Ayer";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  return fechaDeIso(fecha).toLocaleDateString("es-MX", { weekday: "long" });
}

export default function AgendaHoy({ fecha, hoy, onCambiarFecha, clases, materias, eventosGoogle, onRefetch }: Props) {
  const [modalCrear, setModalCrear] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);

  const { items, todoElDia: todoDiaGoogle } = construirAgendaDia(
    fecha, clases, materias, eventosDelDia(eventosGoogle, fecha)
  );
  const sinEventos = items.length === 0 && todoDiaGoogle.length === 0;

  const labelDia = getLabelDia(fecha, hoy);
  const fechaStr = fechaDeIso(fecha).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <section data-tutorial-id="agenda-section">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">{labelDia}</h2>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{fechaStr}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCambiarFecha(sumarDias(fecha, -1))}
            aria-label="Día anterior"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => onCambiarFecha(sumarDias(fecha, 1))}
            aria-label="Día siguiente"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <button
            onClick={() => setModalCrear(true)}
            data-tutorial-id="btn-crear-evento"
            className="ml-1 flex items-center gap-1 bg-blue-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Evento
          </button>
        </div>
      </div>

      {sinEventos ? (
        <EmptyState title="Sin eventos" />
      ) : (
        <div className="space-y-1.5">
          {/* Eventos todo el día */}
          {todoDiaGoogle.map((e) => (
            <button
              key={e.id}
              onClick={() => setEventoSeleccionado(e)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-0.5 self-stretch rounded-full flex-shrink-0 bg-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-medium truncate">{e.titulo}</p>
                <p className="text-xs text-gray-400">Todo el día</p>
              </div>
              <CalendarIcon />
            </button>
          ))}

          {/* Eventos con hora */}
          {items.map((item) => {
            const esGoogle = item.origen === "google";
            const Wrapper = esGoogle ? "button" : "div";
            return (
              <Wrapper
                key={item.id}
                {...(esGoogle && { onClick: () => setEventoSeleccionado(item.eventoOriginal!) })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                  item.estado === "activa"
                    ? "border-blue-200 bg-blue-50"
                    : item.estado === "pasada"
                    ? "border-gray-100 bg-gray-50 opacity-50"
                    : "border-gray-100 bg-white"
                } ${esGoogle ? "hover:bg-gray-50 cursor-pointer" : ""}`}
              >
                <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium truncate">{item.titulo}</p>
                  <p className="text-xs text-gray-400">
                    {item.horaInicio} – {item.horaFin}
                    {item.salon ? ` · ${item.salon}` : ""}
                  </p>
                </div>
                {item.zoomUrl && (
                  <a
                    href={item.zoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors flex-shrink-0"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                    Zoom
                  </a>
                )}
                {!item.zoomUrl && item.estado === "activa" && (
                  <span className="text-xs font-medium text-blue-900 bg-blue-100 px-2 py-0.5 rounded">Ahora</span>
                )}
                {item.zoomUrl && item.estado === "activa" && (
                  <span className="text-xs font-medium text-blue-900 bg-blue-100 px-2 py-0.5 rounded flex-shrink-0">Ahora</span>
                )}
                {esGoogle && item.estado !== "activa" && !item.zoomUrl && <CalendarIcon />}
              </Wrapper>
            );
          })}
        </div>
      )}

      <EventoCalendarioModal
        evento={eventoSeleccionado}
        onClose={() => setEventoSeleccionado(null)}
        onRefetch={() => { onRefetch(); setEventoSeleccionado(null); }}
      />

      <CrearEventoModal
        open={modalCrear}
        fechaDefault={fecha}
        onClose={() => setModalCrear(false)}
        onCreado={onRefetch}
      />
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
