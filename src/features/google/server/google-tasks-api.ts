export const TASKS_BASE = "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks";

/** Fecha YYYY-MM-DD → formato `due` de Google Tasks (solo se usa el día). */
export function dueDesdeFecha(fecha: string): string {
  return `${fecha}T00:00:00.000Z`;
}

/** Cuerpo de una tarea nueva de Google Tasks a partir de los datos de un pendiente. */
export function cuerpoTarea(
  titulo: string,
  descripcion?: string | null,
  fechaLimite?: string | null,
  completado = false,
): Record<string, string> {
  const body: Record<string, string> = { title: titulo };
  if (descripcion) body.notes = descripcion;
  if (fechaLimite) body.due = dueDesdeFecha(fechaLimite);
  if (completado) body.status = "completed";
  return body;
}
