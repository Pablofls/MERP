// Datos de ejemplo para las vistas previas de la ficha de cada módulo.
// Las fechas son relativas a hoy, así las capturas siempre se ven vigentes. Nada de esto se guarda.
import type {
  CategoriaPersonal,
  ClaseHorario,
  DiaSemana,
  FechaImportante,
  Habito,
  Materia,
  Pendiente,
  RegistroHabito,
} from "@/lib/types";
import { fechaHoy, fechaRelativa } from "@/lib/utils";

// ── Escolar ─────────────────────────────────────────────────────────────────────────────────────
export const MATERIAS_DEMO: Materia[] = [
  { id: "demo-calc", nombre: "Cálculo", color: "#1e4976" },
  { id: "demo-fis", nombre: "Física", color: "#1a5c3e" },
  { id: "demo-prog", nombre: "Programación", color: "#7c2d2d" },
  { id: "demo-ing", nombre: "Inglés", color: "#7c5c2e" },
];

function clase(claseId: string, materiaId: string, dias: DiaSemana[], horaInicio: string, horaFin: string, salon: string): ClaseHorario[] {
  return dias.map((dia) => ({ id: `${claseId}:${dia}`, claseId, materiaId, dia, horaInicio, horaFin, salon }));
}

export const CLASES_DEMO: ClaseHorario[] = [
  ...clase("demo-c1", "demo-calc", ["lunes", "miércoles"], "07:00", "08:30", "A-201"),
  ...clase("demo-c2", "demo-fis", ["martes", "jueves"], "09:00", "10:30", "Lab 3"),
  ...clase("demo-c3", "demo-prog", ["lunes", "miércoles", "viernes"], "11:30", "13:00", "3214"),
  ...clase("demo-c4", "demo-ing", ["martes", "jueves"], "13:00", "14:30", "4203-C"),
];

export function fechasImportantesDemo(): FechaImportante[] {
  return [
    { id: "demo-f1", titulo: "Segundo parcial", fecha: fechaRelativa(3), materiaId: "demo-calc", tipo: "examen_parcial", completado: false },
    { id: "demo-f2", titulo: "Entrega del proyecto final", fecha: fechaRelativa(6), materiaId: "demo-prog", tipo: "proyecto", completado: false },
    { id: "demo-f3", titulo: "Quiz de cinemática", fecha: fechaRelativa(10), materiaId: "demo-fis", tipo: "quiz", completado: false },
    { id: "demo-f4", titulo: "Examen final", fecha: fechaRelativa(24), materiaId: "demo-ing", tipo: "examen_final", completado: false },
  ];
}

function pendiente(id: string, titulo: string, tipo: Pendiente["tipo"], sub: string, dias: number | null): Pendiente {
  return {
    id,
    titulo,
    tipo,
    completado: false,
    fechaLimite: dias === null ? undefined : fechaRelativa(dias),
    ...(tipo === "escolar" ? { materiaId: sub } : { categoriaPersonalId: sub }),
  };
}

export function pendientesEscolaresDemo(): Pendiente[] {
  return [
    pendiente("demo-pe1", "Tarea 5: integrales por partes", "escolar", "demo-calc", 1),
    pendiente("demo-pe2", "Reporte de laboratorio", "escolar", "demo-fis", 2),
    pendiente("demo-pe3", "Resolver guía del parcial", "escolar", "demo-calc", 2),
    pendiente("demo-pe4", "Implementar la API del proyecto", "escolar", "demo-prog", 5),
    pendiente("demo-pe5", "Essay: technology and society", "escolar", "demo-ing", 8),
    pendiente("demo-pe6", "Leer capítulo 4", "escolar", "demo-fis", null),
  ];
}

// ── Personal ────────────────────────────────────────────────────────────────────────────────────
export const CATEGORIAS_DEMO: CategoriaPersonal[] = [
  { id: "demo-cat-personal", nombre: "Personal", color: "#4a3a6b" },
  { id: "demo-cat-fitness", nombre: "Fitness", color: "#1a5c3e" },
  { id: "demo-cat-lectura", nombre: "Lectura", color: "#7c5c2e" },
  { id: "demo-cat-trabajo", nombre: "Trabajo", color: "#1e4976" },
];

export function pendientesPersonalesDemo(): Pendiente[] {
  return [
    pendiente("demo-pp1", "Pagar la tarjeta", "personal", "demo-cat-personal", 0),
    pendiente("demo-pp2", "Agendar cita con el dentista", "personal", "demo-cat-personal", 0),
    pendiente("demo-pp3", "Correr 5 km", "personal", "demo-cat-fitness", 1),
    pendiente("demo-pp4", "Preparar la presentación", "personal", "demo-cat-trabajo", 3),
    pendiente("demo-pp5", "Terminar «Hábitos atómicos»", "personal", "demo-cat-lectura", 4),
    pendiente("demo-pp6", "Renovar el pasaporte", "personal", "demo-cat-personal", null),
  ];
}

// ── Hábitos ─────────────────────────────────────────────────────────────────────────────────────
export const HABITOS_DEMO: Habito[] = [
  { id: "demo-h1", topico: "Leer 20 minutos", tipoMedida: "booleana", frecuencia: "diaria", activo: true },
  { id: "demo-h2", topico: "Correr", tipoMedida: "numerica", unidad: "km", frecuencia: "semanal", metaCantidadSemanal: 15, activo: true },
  { id: "demo-h3", topico: "Tomar agua", tipoMedida: "numerica", unidad: "vasos", frecuencia: "diaria", activo: true },
  { id: "demo-h4", topico: "Gimnasio", tipoMedida: "booleana", frecuencia: "semanal", metaSemanal: 4, activo: true },
];

/** ~5 semanas de registros con un patrón fijo (siempre el mismo para la misma fecha). */
export function registrosHabitosDemo(): RegistroHabito[] {
  const registros: RegistroHabito[] = [];
  for (let i = 0; i <= 34; i++) {
    const fecha = fechaRelativa(-i);
    const semilla = Number(fecha.replaceAll("-", "")) % 97;
    const r = (k: number) => (semilla * 31 + k * 17) % 10; // 0..9
    const add = (habitoId: string, valor: number) =>
      registros.push({ id: `demo-r-${habitoId}-${fecha}`, habitoId, fecha, valor });

    if (i === 0 || r(1) < 8) add("demo-h1", 1);
    if (i > 0 && r(2) < 4) add("demo-h2", 3 + (r(5) % 4));
    if (i === 0 || r(3) < 9) add("demo-h3", 5 + (r(6) % 4));
    if (i > 0 && r(4) < 5) add("demo-h4", 1);
  }
  return registros;
}

/** Lo que muestra cada tarjeta del día en la vista previa. */
export function resumenHabitosDemo(registros: RegistroHabito[]) {
  const hoy = fechaHoy();
  const dow = (new Date(hoy + "T12:00:00").getDay() + 6) % 7; // lunes = 0
  const lunes = fechaRelativa(-dow);
  const semana = (habitoId: string) => registros.filter((r) => r.habitoId === habitoId && r.fecha >= lunes);
  return {
    hoy,
    registroDia: (habitoId: string) => registros.find((r) => r.habitoId === habitoId && r.fecha === hoy),
    racha: { "demo-h1": 12, "demo-h2": 3, "demo-h3": 21, "demo-h4": 2 } as Record<string, number>,
    sumaSemana: (habitoId: string) => semana(habitoId).reduce((s, r) => s + r.valor, 0),
    conteoSemana: (habitoId: string) => semana(habitoId).filter((r) => r.valor > 0).length,
  };
}
