import type { ReactNode } from "react";
import type { Modulo } from "@/lib/types";

/**
 * Parte de cada módulo que solo existe en el código (ruta, ícono, etiqueta del menú).
 * El catálogo (nombre, descripción, clase, orden) vive en la BD, tabla `modulos`.
 *
 * Para agregar un módulo nuevo (p. ej. Finanzas):
 *  1. Migración: insert en `modulos` (y en `plantillas_pendientes` si es plantilla de pendientes).
 *  2. Entrada en REGISTRO_MODULOS con su ruta e ícono, y en CATALOGO_RESPALDO.
 *  3. `src/app/<ruta>/layout.tsx` que envuelva la página en <ModuloGuard clave="…">.
 * Un módulo del catálogo sin entrada aquí no aparece en la app.
 */
export interface ModuloUI {
  ruta: string;
  etiqueta: string; // texto en el menú (también define la letra del atajo de teclado)
  icono: (active: boolean) => ReactNode;
}

export const REGISTRO_MODULOS: Record<string, ModuloUI> = {
  escolar: {
    ruta: "/escolar",
    etiqueta: "Escolar",
    icono: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  personal: {
    ruta: "/personal",
    etiqueta: "Personal",
    icono: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  habitos: {
    ruta: "/habitos",
    etiqueta: "Habitos",
    icono: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
};

/** Ícono de la sección Módulos (cuadrícula). */
export function IconoModulos({ active = false, className = "w-5 h-5" }: { active?: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

/**
 * Copia del catálogo sembrado en 20261106_modulos.sql. Se usa mientras carga el de la BD o si la
 * consulta falla (p. ej. migración aún no aplicada), para que el menú se vea igual que antes.
 */
export const CATALOGO_RESPALDO: Modulo[] = [
  { clave: "escolar", clase: "plantilla_pendientes", nombre: "Escolar", orden: 1,
    descripcion: "Materias con su horario de clases, fechas importantes y pendientes por materia." },
  { clave: "personal", clase: "plantilla_pendientes", nombre: "Personal", orden: 2,
    descripcion: "Pendientes personales organizados en las categorías que tú crees." },
  { clave: "habitos", clase: "aplicacion", nombre: "Hábitos", orden: 3,
    descripcion: "Da seguimiento a tus hábitos diarios y semanales con metas y registros." },
];

/** Módulos activos por defecto (activo_por_defecto en la BD): lo que todos ven hoy. */
export const ACTIVOS_RESPALDO = ["escolar", "personal", "habitos"];

/** Clave del módulo dueño de una ruta ("/escolar/x" → "escolar"), o null si la ruta no es de un módulo. */
export function moduloDeRuta(ruta: string): string | null {
  for (const [clave, ui] of Object.entries(REGISTRO_MODULOS)) {
    if (ruta === ui.ruta || ruta.startsWith(ui.ruta + "/")) return clave;
  }
  return null;
}
