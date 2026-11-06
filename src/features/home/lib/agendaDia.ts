import type { ClaseHorario, DiaSemana, Materia } from "@/lib/types";
import { minutosDesdeMedianoche } from "@/lib/utils";

export interface EventoGoogle {
  id: string;
  titulo: string;
  descripcion?: string | null;
  hangoutLink?: string | null;
  inicio: string | null; // ISO dateTime, o "YYYY-MM-DD" si es de todo el día
  fin: string | null;
  todoElDia: boolean;
  recurringEventId?: string | null;
}

export interface ItemAgenda {
  id: string;
  titulo: string;
  horaInicio: string;
  horaFin: string;
  minutosInicio: number;
  color: string;
  estado: "activa" | "pasada" | "futura";
  origen: "app" | "google";
  salon?: string;
  zoomUrl?: string | null;
  eventoOriginal?: EventoGoogle;
}

export interface AgendaDia {
  items: ItemAgenda[];
  todoElDia: EventoGoogle[];
}

const DIAS: DiaSemana[] = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "YYYY-MM-DD" con la fecha local (no UTC). */
export function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "YYYY-MM-DD" → Date local a medianoche. */
export function fechaDeIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(iso: string, dias: number): string {
  const d = fechaDeIso(iso);
  d.setDate(d.getDate() + dias);
  return isoLocal(d);
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function extractZoomUrl(descripcion?: string | null, hangoutLink?: string | null): string | null {
  if (hangoutLink?.includes("zoom.us")) return hangoutLink;
  const match = descripcion?.match(/https?:\/\/[^\s]*zoom\.us\/[^\s]*/);
  return match?.[0] ?? null;
}

/** Eventos de Google que caen (total o parcialmente) en el día dado. */
export function eventosDelDia(eventos: EventoGoogle[], fecha: string): EventoGoogle[] {
  const siguiente = sumarDias(fecha, 1);
  const iniDia = fechaDeIso(fecha).getTime();
  const finDia = fechaDeIso(siguiente).getTime();
  return eventos.filter((e) => {
    if (!e.inicio) return false;
    if (e.todoElDia) {
      // fin es exclusivo en Google ("YYYY-MM-DD")
      const fin = e.fin ?? sumarDias(e.inicio, 1);
      return e.inicio <= fecha && fecha < fin;
    }
    const ini = new Date(e.inicio).getTime();
    const fin = e.fin ? new Date(e.fin).getTime() : ini;
    return ini < finDia && fin > iniDia;
  });
}

/**
 * Arma la agenda de un día: clases de la app + eventos de Google (sin duplicar
 * los que coinciden con una clase) + eventos de todo el día.
 */
export function construirAgendaDia(
  fecha: string,
  clases: ClaseHorario[],
  materias: Materia[],
  eventosGoogleDia: EventoGoogle[],
  ahora: Date = new Date(),
): AgendaDia {
  const dia = DIAS[fechaDeIso(fecha).getDay()];
  const esHoy = fecha === isoLocal(ahora);
  const esPasado = fecha < isoLocal(ahora);
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

  function getEstado(ini: number, fin: number): ItemAgenda["estado"] {
    if (!esHoy) return esPasado ? "pasada" : "futura";
    if (horaActual >= ini && horaActual < fin) return "activa";
    if (horaActual >= fin) return "pasada";
    return "futura";
  }

  const conHora = eventosGoogleDia.filter((e) => !e.todoElDia && e.inicio && e.fin);

  const itemsApp: ItemAgenda[] = clases
    .filter((c) => {
      if (c.dia !== dia) return false;
      if (c.fechaInicio && fecha < c.fechaInicio) return false;
      if (c.fechaFin && fecha > c.fechaFin) return false;
      return true;
    })
    .map((c) => {
      const mat = materias.find((m) => m.id === c.materiaId);
      const ini = minutosDesdeMedianoche(c.horaInicio);
      const fin = minutosDesdeMedianoche(c.horaFin);
      // Evento de Google duplicado (se omite de la lista) para tomar su liga de Zoom
      const googleMatch = conHora.find(
        (e) => e.titulo.toLowerCase() === (mat?.nombre ?? "").toLowerCase() &&
          Math.abs(minutosDesdeMedianoche(formatHora(e.inicio!)) - ini) <= 5
      );
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
        zoomUrl: extractZoomUrl(googleMatch?.descripcion, googleMatch?.hangoutLink),
      };
    });

  const itemsGoogle: ItemAgenda[] = conHora
    .filter((e) => {
      const iniMin = minutosDesdeMedianoche(formatHora(e.inicio!));
      return !itemsApp.some(
        (a) => a.titulo.toLowerCase() === e.titulo.toLowerCase() && Math.abs(a.minutosInicio - iniMin) <= 5
      );
    })
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
        estado: getEstado(ini, fin <= ini ? 24 * 60 : fin),
        origen: "google" as const,
        eventoOriginal: e,
        zoomUrl: extractZoomUrl(e.descripcion, e.hangoutLink),
      };
    });

  return {
    items: [...itemsApp, ...itemsGoogle].sort((a, b) => a.minutosInicio - b.minutosInicio),
    todoElDia: eventosGoogleDia.filter((e) => e.todoElDia),
  };
}
