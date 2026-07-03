"use client";
import type { ClaseHorario, Materia } from "@/lib/types";
import type { GoogleEventoHoy } from "@/lib/hooks/useGoogleCalendar";
import { getDiaSemanaActual, minutosDesdeMedianoche } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

interface Props {
  clases: ClaseHorario[];
  materias: Materia[];
  googleEventos?: GoogleEventoHoy[];
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
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function AgendaHoy({ clases, materias, googleEventos = [] }: Props) {
  const diaHoy = getDiaSemanaActual();
  const horaActual = new Date().getHours() * 60 + new Date().getMinutes();

  function getEstado(inicioMin: number, finMin: number): ItemAgenda["estado"] {
    if (horaActual >= inicioMin && horaActual < finMin) return "activa";
    if (horaActual >= finMin) return "pasada";
    return "futura";
  }

  // Clases del app (horario semanal)
  const itemsApp: ItemAgenda[] = clases
    .filter((c) => c.dia === diaHoy)
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

  // Eventos de Google Calendar (solo los de hoy con hora)
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
      };
    });

  // Eventos de todo el día de Google Calendar
  const todoDiaGoogle = googleEventos.filter((e) => e.todoElDia);

  // Merge y ordenar por hora
  const items = [...itemsApp, ...itemsGoogle].sort(
    (a, b) => a.minutosInicio - b.minutosInicio
  );

  const sinEventos = items.length === 0 && todoDiaGoogle.length === 0;

  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Hoy</h2>
        <p className="text-xs text-gray-400 capitalize mt-0.5">{fechaStr}</p>
      </div>

      {sinEventos ? (
        <EmptyState title="Sin eventos hoy" />
      ) : (
        <div className="space-y-1.5">
          {/* Eventos todo el día */}
          {todoDiaGoogle.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
            >
              <div className="w-0.5 self-stretch rounded-full flex-shrink-0 bg-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-medium truncate">{e.titulo}</p>
                <p className="text-xs text-gray-400">Todo el día</p>
              </div>
              <CalendarIcon />
            </div>
          ))}

          {/* Eventos con hora */}
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                item.estado === "activa"
                  ? "border-blue-200 bg-blue-50"
                  : item.estado === "pasada"
                  ? "border-gray-100 bg-gray-50 opacity-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div
                className="w-0.5 self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium truncate">{item.titulo}</p>
                <p className="text-xs text-gray-400">
                  {item.horaInicio} – {item.horaFin}
                  {item.salon ? ` · ${item.salon}` : ""}
                </p>
              </div>
              {item.estado === "activa" && (
                <span className="text-xs font-medium text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  Ahora
                </span>
              )}
              {item.origen === "google" && item.estado !== "activa" && (
                <CalendarIcon />
              )}
            </div>
          ))}
        </div>
      )}
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
