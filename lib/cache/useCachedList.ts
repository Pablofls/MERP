"use client";
import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useUser } from "../context/AuthContext";

const VACIO: never[] = [];

/**
 * Lista respaldada por la caché compartida (TanStack Query). Devuelve [datos, setDatos]
 * con la misma forma que useState, así los hooks conservan sus mutaciones optimistas.
 * Los datos sobreviven a la navegación y se persisten en localStorage.
 */
export function useCachedList<T>(
  key: string,
  fetcher: (user: User) => Promise<T[]>,
  extra: string | null = "",
): [T[], Dispatch<SetStateAction<T[]>>] {
  const user = useUser();
  const qc = useQueryClient();
  const queryKey = [key, user?.id ?? null, extra];

  const { data } = useQuery({
    queryKey,
    queryFn: () => fetcher(user!),
    enabled: !!user && extra !== null,
  });

  const keyStr = JSON.stringify(queryKey);
  const setData = useCallback<Dispatch<SetStateAction<T[]>>>(
    (update) => {
      qc.setQueryData<T[]>(JSON.parse(keyStr), (prev) =>
        typeof update === "function" ? update(prev ?? (VACIO as T[])) : update,
      );
    },
    [qc, keyStr],
  );

  return [data ?? (VACIO as T[]), setData];
}

/** Lanza si Supabase devuelve error para que la caché conserve los datos previos. */
export function ok<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error || !data) throw error ?? new Error("sin datos");
  return data;
}
