import type { DiaSemana } from "./types";

export const DIAS_SEMANA: DiaSemana[] = [
  "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo",
];

export const DIAS_SHORT: Record<DiaSemana, string> = {
  lunes: "Lun",
  martes: "Mar",
  miércoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sábado: "Sáb",
  domingo: "Dom",
};

export function getDiaSemanaActual(): DiaSemana {
  const dias: DiaSemana[] = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  return dias[new Date().getDay()];
}

export function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatFechaCorta(iso: string): string {
  const fecha = new Date(iso + "T00:00:00");
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function esFechaVencida(iso: string): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(iso + "T00:00:00");
  return fecha < hoy;
}

export function fechaHoy(): string {
  return new Date().toISOString().split("T")[0];
}

export function etiquetaFecha(iso: string): string {
  const hoy = fechaHoy();
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaIso = manana.toISOString().split("T")[0];
  if (iso === hoy) return "Hoy";
  if (iso === mananaIso) return "Mañana";
  return formatFechaCorta(iso);
}

export function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

const HABIT_PALETTE = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6",
];

export function getHabitColor(habitId: string): string {
  let hash = 0;
  for (let i = 0; i < habitId.length; i++) {
    hash = habitId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return HABIT_PALETTE[Math.abs(hash) % HABIT_PALETTE.length];
}
