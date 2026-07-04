"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useGoogleStatus } from "@/lib/hooks/useGoogleStatus";
import type { User } from "@supabase/supabase-js";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks",
].join(" ");

export default function PerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const { conectado, desconectar } = useGoogleStatus();
  const recienConectado = searchParams.get("google") === "conectado";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  function conectarGoogle() {
    const redirectUri = `${window.location.origin}/auth/callback/google`;
    const state = crypto.randomUUID();
    sessionStorage.setItem("google_oauth_state", state);
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Perfil</h1>

      {/* Info usuario */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Cuenta</p>
        <p className="text-sm font-medium text-gray-900">{user?.email ?? "—"}</p>
      </div>

      {/* Google Calendar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          {/* Logo Google Calendar */}
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="8" fill="#fff" />
            <path d="M34 14H14a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2z" fill="#1a73e8" />
            <path d="M14 22h20v2H14z" fill="#fff" opacity=".3" />
            <rect x="18" y="11" width="3" height="6" rx="1.5" fill="#1a73e8" />
            <rect x="27" y="11" width="3" height="6" rx="1.5" fill="#1a73e8" />
            <path d="M18 28h3v3h-3zM22.5 28h3v3h-3zM27 28h3v3h-3zM18 32.5h3v3h-3zM22.5 32.5h3v3h-3zM27 32.5h3v3h-3z" fill="#fff" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-gray-900">Google Calendar</p>
            <p className="text-xs text-gray-400">
              {conectado === null
                ? "Verificando..."
                : conectado
                ? "Cuenta conectada"
                : "No conectado"}
            </p>
          </div>
          {conectado && (
            <span className="ml-auto w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          )}
        </div>

        {recienConectado && conectado && (
          <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
            Google Calendar conectado correctamente.
          </p>
        )}

        {conectado === false && (
          <button
            onClick={conectarGoogle}
            className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Conectar con Google
          </button>
        )}

        {conectado && (
          <button
            onClick={desconectar}
            className="w-full py-2 rounded-lg text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Desconectar Google Calendar
          </button>
        )}
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={cerrarSesion}
        className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
