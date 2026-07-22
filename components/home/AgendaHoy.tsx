"use client";
import { useState } from "react";
import type { ClaseHorario, Materia } from "@/lib/types";
import { useGoogleCalendar } from "@/lib/hooks/useGoogleCalendar";
import { getDiaSemanaActual, minutosDesdeMedianoche, fechaHoy } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import EventoCalendarioModal, { type EventoCalendario } from "@/components/home/EventoCalendarioModal";
import CrearEventoModal from "@/components/home/CrearEventoModal";

interface Props {
  clases: ClaseHorario[];
  materias: Materia[];
}

interface ItemAgenda {
  id: string;
  titulo: string;
  horaInicio: string;
  horaFin: string;
  minutosInicio: number;
  color: string;
  estado: "activa" | "pasada" | "futura";
  origen: "app" | "google";
  salon?: string;
  todoElDia?: boolean;
  eventoOriginal?: { id: string; titulo: string; descripcion?: string | null; hangoutLink?: string | null; inicio: string | null; fin: string | null; todoElDia: boolean; recurringEventId?: string | null };
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function getFechaConOffset(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

function getLabelDia(offset: number): string {
  if (offset === 0) return "Hoy";
  if (offset === -1) return "Ayer";
  if (offset === 1) return "Mañana";
  const d = getFechaConOffset(offset);
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });
}

function getIsoFecha(offset: number): string {
  return getFechaConOffset(offset).toISOString().split("T")[0];
}

function getDiaSemanaConOffset(offset: number) {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;
  const d = getFechaConOffset(offset);
  return dias[d.getDay()];
}

export default function AgendaHoy({ clases, materias }: Props) {
  const [diaOffset, setDiaOffset] = useState(0);
  const [modalCrear, setModalCrear] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);

  const { eventos: googleEventos, refetch } = useGoogleCalendar(diaOffset);

  const diaActual = getDiaSemanaConOffset(diaOffset);
  const horaActual = new Date().getHours() * 60 + new Date().getMinutes();
  const esMismaFecha = diaOffset === 0;

  function getEstado(inicioMin: number, finMin: number): ItemAgenda["estado"] {
    if (!esMismaFecha) return finMin < horaActual ? "pasada" : "futura";
    if (horaActual >= inicioMin && horaActual < finMin) return "activa";
    if (horaActual >= finMin) return "pasada";
    return "futura";
  }

  const itemsApp: ItemAgenda[] = clases
    .filter((c) => c.dia === diaActual)
    .map((c) => {
      const mat = materias.find((m) => m.id === c.materiaId);
      const ini = minutosDesdeMedianoche(c.horaInicio);
      const fin = minutosDesdeMedianoche(c.horaFin);
      return {
        id: c.id,
        titulo: mat?.nombre ?? "Clase",
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        minutosInicio: ini,
        color: mat?.color ?? "#94a3b8",
        estado: getEstado(ini, fin),
        origen: "app" as const,
        salon: c.salon,
      };
    });

  const itemsGoogle: ItemAgenda[] = googleEventos
    .filter((e) => !e.todoElDia && e.inicio && e.fin)
    .map((e) => {
      const horaIni = formatHora(e.inicio!);
      const horaFin = formatHora(e.fin!);
      const ini = minutosDesdeMedianoche(horaIni);
      const fin = minutosDesdeMedianoche(horaFin);
      return {
        id: e.id,
        titulo: e.titulo,
        horaInicio: horaIni,
        horaFin: horaFin,
        minutosInicio: ini,
        color: "#475569",
        estado: getEstado(ini, fin),
        origen: "google" as const,
        eventoOriginal: e,
      };
    });

  const todoDiaGoogle = googleEventos.filter((e) => e.todoElDia);
  const items = [...itemsApp, ...itemsGoogle].sort((a, b) => a.minutosInicio - b.minutosInicio);
  const sinEventos = items.length === 0 && todoDiaGoogle.length === 0;

  const labelDia = getLabelDia(diaOffset);
  const fechaStr = getFechaConOffset(diaOffset).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <section>
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">{labelDia}</h2>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{fechaStr}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDiaOffset((o) => o - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => setDiaOffset((o) => o + 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <button
            onClick={() => setModalCrear(true)}
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
                {item.estado === "activa" && (
                  <span className="text-xs font-medium text-blue-900 bg-blue-100 px-2 py-0.5 rounded">Ahora</span>
                )}
                {esGoogle && item.estado !== "activa" && <CalendarIcon />}
              </Wrapper>
            );
          })}
        </div>
      )}

      <EventoCalendarioModal
        evento={eventoSeleccionado}
        onClose={() => setEventoSeleccionado(null)}
        onRefetch={() => { refetch(); setEventoSeleccionado(null); }}
      />

      <CrearEventoModal
        open={modalCrear}
        fechaDefault={getIsoFecha(diaOffset)}
        onClose={() => setModalCrear(false)}
        onCreado={() => { refetch(); }}
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
