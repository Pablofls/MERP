"use client";
import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useUser } from "../context/AuthContext";
import { fetchPendientes } from "../hooks/usePendientes";
import { fetchMaterias } from "../hooks/useMaterias";
import { fetchClases } from "../hooks/useClases";
import { fetchFechas } from "../hooks/useFechasImportantes";
import { fetchCategorias } from "../hooks/useCategorias";
import { fetchHabitos, fetchRegistros } from "../hooks/useHabitos";

type Consulta = { key: string; fetcher: (u: User) => Promise<unknown> };

const PENDIENTES = { key: "pendientes", fetcher: fetchPendientes };
const MATERIAS = { key: "materias", fetcher: fetchMaterias };
const CLASES = { key: "clases", fetcher: fetchClases };
const FECHAS = { key: "fechas_importantes", fetcher: fetchFechas };
const CATEGORIAS = { key: "categorias", fetcher: fetchCategorias };

/** Consultas que necesita cada sección (mismas claves que usan sus hooks). */
const POR_RUTA: Record<string, Consulta[]> = {
  "/": [PENDIENTES, MATERIAS, CLASES, CATEGORIAS, FECHAS],
  "/escolar": [PENDIENTES, MATERIAS, CLASES, FECHAS],
  "/personal": [PENDIENTES, CATEGORIAS],
  "/habitos": [
    { key: "habitos", fetcher: fetchHabitos },
    { key: "registros_habito", fetcher: fetchRegistros },
  ],
};

/**
 * Devuelve prefetchRuta(href) para calentar la caché de una sección (respeta staleTime,
 * así que no repite consultas recientes). Con alIniciar precarga todas las secciones al iniciar sesión.
 */
export function usePrefetchRutas(alIniciar = false) {
  const user = useUser();
  const qc = useQueryClient();

  const prefetchRuta = useCallback(
    (href: string) => {
      if (!user) return;
      for (const { key, fetcher } of POR_RUTA[href] ?? []) {
        qc.prefetchQuery({ queryKey: [key, user.id, ""], queryFn: () => fetcher(user) });
      }
    },
    [user, qc],
  );

  useEffect(() => {
    if (!user || !alIniciar) return;
    // En reposo, para no competir con lo que la pantalla actual necesita
    const idle = (window as any).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500));
    const id = idle(() => Object.keys(POR_RUTA).forEach(prefetchRuta));
    return () => ((window as any).cancelIdleCallback ?? clearTimeout)(id);
  }, [user, alIniciar, prefetchRuta]);

  return prefetchRuta;
}
