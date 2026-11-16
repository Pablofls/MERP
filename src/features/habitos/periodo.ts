import type { RegistroHabito } from "@/lib/types";

/**
 * Periodo actual de un hábito "cada N días" (frecuencia = "semanal").
 *
 * Los periodos son bloques de N días encadenados:
 *  - El primero empieza en el primer registro.
 *  - Si un bloque se cumple, el siguiente empieza pegado (el día base queda fijo) y la racha sube.
 *    Registros de más no adelantan nada: se ve 5/4 y el siguiente bloque sigue empezando el mismo día.
 *  - Si un bloque cierra sin cumplirse, la racha se rompe, el día más viejo se cae y el periodo se recorre
 *    al siguiente registro, sin perder los demás días.
 */
export interface PeriodoHabito {
  inicio: string; // YYYY-MM-DD
  fin: string; // YYYY-MM-DD (incluido)
  dias: number;
  progreso: number; // conteo o suma dentro del periodo; no se topa en la meta
  meta: number;
  cumplido: boolean;
  racha: number; // periodos cumplidos seguidos (incluye el actual si ya se cumplió)
}

export function sumarDias(iso: string, dias: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().split("T")[0];
}

export function calcularPeriodo(
  registros: RegistroHabito[],
  dias: number,
  meta: number,
  modo: "conteo" | "suma",
  hoy: string
): PeriodoHabito {
  const validos = registros
    .filter((r) => r.valor > 0 && r.fecha <= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const pendiente = (racha: number): PeriodoHabito => ({
    inicio: hoy, fin: sumarDias(hoy, dias - 1), dias, progreso: 0, meta, cumplido: false, racha,
  });

  if (validos.length === 0) return pendiente(0);

  function progresoEn(inicio: string, fin: string): number {
    const dentro = validos.filter((r) => r.fecha >= inicio && r.fecha <= fin);
    return modo === "suma" ? dentro.reduce((s, r) => s + r.valor, 0) : dentro.length;
  }

  let inicio = validos[0].fecha;
  let racha = 0;
  while (true) {
    const fin = sumarDias(inicio, dias - 1);
    const progreso = progresoEn(inicio, fin);
    const cumplido = progreso >= meta;

    if (fin >= hoy) {
      return { inicio, fin, dias, progreso, meta, cumplido, racha: racha + (cumplido ? 1 : 0) };
    }

    if (cumplido) {
      racha++;
      inicio = sumarDias(fin, 1); // bloque pegado: el día base no se mueve
      continue;
    }

    // Cerró sin cumplirse: se rompe la racha y el periodo se recorre al siguiente registro.
    racha = 0;
    const siguiente = validos.find((r) => r.fecha > inicio);
    if (!siguiente) return pendiente(0);
    inicio = siguiente.fecha;
  }
}
