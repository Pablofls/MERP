"use client";
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/context/AuthContext";
import { ok } from "@/lib/cache/useCachedList";
import type { ClaseModulo, Modulo } from "@/lib/types";
import { ACTIVOS_RESPALDO, CATALOGO_RESPALDO, REGISTRO_MODULOS } from "../registro";

type ModuloDB = { clave: string; clase: ClaseModulo; nombre: string; descripcion: string; orden: number };

export const fetchCatalogoModulos = async (): Promise<Modulo[]> =>
  (
    ok(
      await supabase.from("modulos").select("clave,clase,nombre,descripcion,orden").order("orden"),
    ) as ModuloDB[]
  ).map((r) => ({ clave: r.clave, clase: r.clase, nombre: r.nombre, descripcion: r.descripcion, orden: r.orden }));

export const fetchModulosActivos = async (): Promise<string[]> =>
  (ok(await supabase.from("usuario_modulos").select("modulo_clave")) as { modulo_clave: string }[]).map(
    (r) => r.modulo_clave,
  );

/**
 * Catálogo de módulos y los que el usuario tiene activos. Mismas claves de caché que useCachedList
 * ([clave, userId, ""]) para que el prefetch por ruta las caliente.
 *
 * Mientras no hay datos de la BD (cargando o error), se asume el catálogo y los activos de respaldo:
 * el menú se ve como siempre y nunca desaparece una sección por un fallo de red.
 */
export function useModulos() {
  const user = useUser();
  const qc = useQueryClient();
  const uid = user?.id ?? null;

  const catalogoQ = useQuery({
    queryKey: ["modulos", uid, ""],
    queryFn: fetchCatalogoModulos,
    enabled: !!user,
    staleTime: 60 * 60_000, // el catálogo casi no cambia
  });
  const activosQ = useQuery({
    queryKey: ["usuario_modulos", uid, ""],
    queryFn: fetchModulosActivos,
    enabled: !!user,
  });

  // Solo los módulos que la app sabe mostrar (tienen ruta e ícono en el registro)
  const catalogo = useMemo(
    () => (catalogoQ.data ?? CATALOGO_RESPALDO).filter((m) => REGISTRO_MODULOS[m.clave]),
    [catalogoQ.data],
  );
  const activos = useMemo(() => new Set(activosQ.data ?? ACTIVOS_RESPALDO), [activosQ.data]);
  const estaActivo = useCallback((clave: string) => activos.has(clave), [activos]);

  /** Activa o desactiva un módulo (optimista). Devuelve false si no se pudo guardar. */
  const cambiar = useCallback(
    async (clave: string, activar: boolean): Promise<boolean> => {
      if (!user) return false;
      const key = ["usuario_modulos", user.id, ""];
      // Sin datos reales de la BD no se escribe: se estaría partiendo del respaldo
      if (!qc.getQueryData<string[]>(key)) return false;

      const aplicar = (on: boolean) =>
        qc.setQueryData<string[]>(key, (prev = []) =>
          on ? (prev.includes(clave) ? prev : [...prev, clave]) : prev.filter((c) => c !== clave),
        );

      aplicar(activar);
      const { error } = activar
        ? await supabase
            .from("usuario_modulos")
            .upsert({ user_id: user.id, modulo_clave: clave }, { onConflict: "user_id,modulo_clave", ignoreDuplicates: true })
        : await supabase.from("usuario_modulos").delete().eq("user_id", user.id).eq("modulo_clave", clave);

      if (error) {
        aplicar(!activar); // rollback
        return false;
      }
      return true;
    },
    [user, qc],
  );

  const activar = useCallback((clave: string) => cambiar(clave, true), [cambiar]);
  const desactivar = useCallback((clave: string) => cambiar(clave, false), [cambiar]);

  return {
    catalogo,
    estaActivo,
    activar,
    desactivar,
    /** true cuando los activos vienen de la BD (y por tanto se pueden cambiar) */
    sincronizado: activosQ.data !== undefined,
    cargando: !!user && activosQ.isPending,
    error: activosQ.isError && activosQ.data === undefined,
  };
}
