"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const AuthContext = createContext<User | null>(null);
const AuthLoadingContext = createContext<boolean>(true);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={user}>
      <AuthLoadingContext.Provider value={loading}>{children}</AuthLoadingContext.Provider>
    </AuthContext.Provider>
  );
}

export function useUser(): User | null {
  return useContext(AuthContext);
}

/** true hasta que se resuelve la sesión inicial (user null no significa "sin sesión" mientras tanto). */
export function useAuthLoading(): boolean {
  return useContext(AuthLoadingContext);
}
