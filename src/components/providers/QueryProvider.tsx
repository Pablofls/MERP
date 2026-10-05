"use client";
import { useEffect, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { supabase } from "@/lib/supabase";

const CACHE_KEY = "merp-query-cache";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, gcTime: 24 * 60 * 60_000, retry: 1 },
        },
      }),
  );
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: CACHE_KEY,
    }),
  );

  // Al cerrar sesión, borra la caché en memoria y la persistida
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        client.clear();
        try { window.localStorage.removeItem(CACHE_KEY); } catch {}
      }
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: 24 * 60 * 60_000, buster: "v1" }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
