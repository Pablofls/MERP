import type { Materia, ClaseHorario, Pendiente, Habito, RegistroHabito } from "./types";

export const MATERIAS_MOCK: Materia[] = [
  { id: "m1", nombre: "Cálculo III", color: "#6366f1" },
  { id: "m2", nombre: "Física II", color: "#f59e0b" },
  { id: "m3", nombre: "Programación Web", color: "#10b981" },
  { id: "m4", nombre: "Álgebra Lineal", color: "#ef4444" },
  { id: "m5", nombre: "Inglés Técnico", color: "#8b5cf6" },
];

export const CLASES_MOCK: ClaseHorario[] = [
  { id: "c1", materiaId: "m1", dia: "lunes",    horaInicio: "07:00", horaFin: "09:00", salon: "A-201" },
  { id: "c2", materiaId: "m2", dia: "lunes",    horaInicio: "09:00", horaFin: "11:00", salon: "Lab F-3" },
  { id: "c3", materiaId: "m3", dia: "martes",   horaInicio: "08:00", horaFin: "10:00", salon: "Cómputo 2" },
  { id: "c4", materiaId: "m4", dia: "martes",   horaInicio: "11:00", horaFin: "13:00", salon: "B-104" },
  { id: "c5", materiaId: "m5", dia: "miércoles",horaInicio: "10:00", horaFin: "11:00", salon: "A-310" },
  { id: "c6", materiaId: "m1", dia: "miércoles",horaInicio: "11:00", horaFin: "13:00", salon: "A-201" },
  { id: "c7", materiaId: "m2", dia: "jueves",   horaInicio: "07:00", horaFin: "09:00", salon: "Lab F-3" },
  { id: "c8", materiaId: "m3", dia: "jueves",   horaInicio: "09:00", horaFin: "11:00", salon: "Cómputo 2" },
  { id: "c9", materiaId: "m4", dia: "viernes",  horaInicio: "08:00", horaFin: "10:00", salon: "B-104" },
  { id:"c10", materiaId: "m5", dia: "viernes",  horaInicio: "12:00", horaFin: "13:00", salon: "A-310" },
];

// Fechas relativas a hoy para que los mocks siempre sean relevantes
function diasDesdeHoy(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

export const PENDIENTES_MOCK: Pendiente[] = [
  {
    id: "p1",
    titulo: "Tarea 3 — Integrales dobles",
    descripcion: "Ejercicios 5.1 al 5.20 del libro",
    fechaLimite: diasDesdeHoy(2),
    completado: false,
    tipo: "escolar",
    materiaId: "m1",
  },
  {
    id: "p2",
    titulo: "Reporte de laboratorio de óptica",
    descripcion: "Incluir análisis de errores y gráficas",
    fechaLimite: diasDesdeHoy(4),
    completado: false,
    tipo: "escolar",
    materiaId: "m2",
  },
  {
    id: "p3",
    titulo: "Proyecto: landing page responsive",
    descripcion: "HTML + CSS + JS vanilla, subir a GitHub",
    fechaLimite: diasDesdeHoy(7),
    completado: false,
    tipo: "escolar",
    materiaId: "m3",
  },
  {
    id: "p4",
    titulo: "Examen parcial — Álgebra Lineal",
    fechaLimite: diasDesdeHoy(10),
    completado: false,
    tipo: "escolar",
    materiaId: "m4",
  },
  {
    id: "p5",
    titulo: "Preparar exposición en inglés",
    descripcion: "5 minutos sobre tu área de especialización",
    fechaLimite: diasDesdeHoy(5),
    completado: false,
    tipo: "escolar",
    materiaId: "m5",
  },
  {
    id: "p6",
    titulo: "Estudiar para cálculo (repaso integrales)",
    completado: true,
    tipo: "escolar",
    materiaId: "m1",
  },
  {
    id: "p7",
    titulo: "Pagar renta",
    fechaLimite: diasDesdeHoy(3),
    completado: false,
    tipo: "personal",
  },
  {
    id: "p8",
    titulo: "Comprar comida para la semana",
    completado: false,
    tipo: "personal",
  },
  {
    id: "p9",
    titulo: "Enviar informe mensual al trabajo",
    descripcion: "Resumen de actividades de junio",
    fechaLimite: diasDesdeHoy(1),
    completado: false,
    tipo: "personal",
  },
  {
    id: "p10",
    titulo: "Revisión médica anual",
    fechaLimite: diasDesdeHoy(14),
    completado: false,
    tipo: "personal",
  },
  {
    id: "p11",
    titulo: "Renovar credencial universitaria",
    completado: true,
    tipo: "personal",
  },
];

export const HABITOS_MOCK: Habito[] = [
  { id: "h1", topico: "Correr",    tipoMedida: "numerica",  unidad: "km",      activo: true },
  { id: "h2", topico: "Ejercicio", tipoMedida: "numerica",  unidad: "minutos", activo: true },
  { id: "h3", topico: "Creatina",  tipoMedida: "booleana",                     activo: true },
  { id: "h4", topico: "Leer",      tipoMedida: "numerica",  unidad: "páginas", activo: true },
  { id: "h5", topico: "Meditar",   tipoMedida: "booleana",                     activo: true },
];

function fechaHace(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
}

export const REGISTROS_MOCK: RegistroHabito[] = [
  // Correr
  { id: "r1",  habitoId: "h1", fecha: fechaHace(0), valor: 5 },
  { id: "r2",  habitoId: "h1", fecha: fechaHace(2), valor: 4 },
  { id: "r3",  habitoId: "h1", fecha: fechaHace(4), valor: 6 },
  { id: "r4",  habitoId: "h1", fecha: fechaHace(6), valor: 5 },
  // Ejercicio
  { id: "r5",  habitoId: "h2", fecha: fechaHace(0), valor: 45 },
  { id: "r6",  habitoId: "h2", fecha: fechaHace(1), valor: 30 },
  { id: "r7",  habitoId: "h2", fecha: fechaHace(2), valor: 60 },
  { id: "r8",  habitoId: "h2", fecha: fechaHace(4), valor: 45 },
  { id: "r9",  habitoId: "h2", fecha: fechaHace(5), valor: 30 },
  // Creatina
  { id: "r10", habitoId: "h3", fecha: fechaHace(0), valor: 1 },
  { id: "r11", habitoId: "h3", fecha: fechaHace(1), valor: 1 },
  { id: "r12", habitoId: "h3", fecha: fechaHace(2), valor: 1 },
  { id: "r13", habitoId: "h3", fecha: fechaHace(3), valor: 0 },
  { id: "r14", habitoId: "h3", fecha: fechaHace(4), valor: 1 },
  { id: "r15", habitoId: "h3", fecha: fechaHace(5), valor: 1 },
  { id: "r16", habitoId: "h3", fecha: fechaHace(6), valor: 1 },
  // Leer
  { id: "r17", habitoId: "h4", fecha: fechaHace(0), valor: 20 },
  { id: "r18", habitoId: "h4", fecha: fechaHace(1), valor: 15 },
  { id: "r19", habitoId: "h4", fecha: fechaHace(3), valor: 30 },
  { id: "r20", habitoId: "h4", fecha: fechaHace(5), valor: 25 },
  // Meditar
  { id: "r21", habitoId: "h5", fecha: fechaHace(0), valor: 1 },
  { id: "r22", habitoId: "h5", fecha: fechaHace(1), valor: 1 },
  { id: "r23", habitoId: "h5", fecha: fechaHace(2), valor: 0 },
  { id: "r24", habitoId: "h5", fecha: fechaHace(3), valor: 1 },
  { id: "r25", habitoId: "h5", fecha: fechaHace(4), valor: 1 },
  { id: "r26", habitoId: "h5", fecha: fechaHace(5), valor: 1 },
  { id: "r27", habitoId: "h5", fecha: fechaHace(6), valor: 0 },
];
