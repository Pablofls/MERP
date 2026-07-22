export type DiaSemana = "lunes" | "martes" | "miércoles" | "jueves" | "viernes" | "sábado" | "domingo";

export interface Materia {
  id: string;
  nombre: string;
  color: string; // hex color
}

export interface ClaseHorario {
  id: string;
  materiaId: string;
  dia: DiaSemana;
  horaInicio: string; // "HH:MM"
  horaFin: string;    // "HH:MM"
  salon?: string;
  fechaInicio?: string | null; // "YYYY-MM-DD"
  fechaFin?: string | null;    // "YYYY-MM-DD"
  // Para Fase 3
  googleEventId?: string | null;
}

export interface Evento {
  id: string;
  titulo: string;
  fechaInicio: string; // ISO date string
  fechaFin: string;
  tipo: "escolar" | "personal";
  materiaId?: string;
  // Para Fase 3
  googleEventId?: string | null;
}

export interface Pendiente {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaLimite?: string; // ISO date string
  completado: boolean;
  tipo: "escolar" | "personal";
  materiaId?: string; // solo si tipo === "escolar"
  // Para Fase 3
  googleTaskId?: string | null;
}

export interface Habito {
  id: string;
  topico: string;
  tipoMedida: "numerica" | "booleana";
  unidad?: string; // ej: "km", "páginas", "minutos"
  frecuencia: "diaria" | "semanal";
  metaSemanal?: number; // veces por semana (frecuencia === "semanal", modo conteo)
  metaCantidadSemanal?: number; // total acumulado por semana (frecuencia === "semanal", modo acumulado)
  activo: boolean;
}

export interface Subtarea {
  id: string;
  pendienteId: string;
  titulo: string;
  completado: boolean;
}

export interface RegistroHabito {
  id: string;
  habitoId: string;
  fecha: string; // ISO date "YYYY-MM-DD"
  valor: number; // 1 = sí para booleanos, número para numéricos
}
