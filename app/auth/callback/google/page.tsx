"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<"procesando" | "error">("procesando");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");

    if (!code) {
      setEstado("error");
      setError("No se recibió código de autorización.");
      return;
    }

    // Validate state to prevent CSRF
    const savedState = sessionStorage.getItem("google_oauth_state");
    sessionStorage.removeItem("google_oauth_state");
    if (!returnedState || returnedState !== savedState) {
      setEstado("error");
      setError("Estado OAuth inválido. Intenta de nuevo.");
      return;
    }

    async function handleCallback() {
      const redirectUri = `${window.location.origin}/auth/callback/google`;

      // Obtener sesión para autenticar la llamada al exchange endpoint
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setEstado("error");
        setError("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }

      // Intercambiar code por tokens (server-side para proteger client_secret)
      const exchangeRes = await fetch("/api/google/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (!exchangeRes.ok) {
        const err = await exchangeRes.json();
        setEstado("error");
        setError(err.error ?? "Error al conectar con Google.");
        return;
      }

      const tokens = await exchangeRes.json();

      // Guardar solo refresh_token — el access_token es efímero y no debe persistirse
      const { error: dbError } = await supabase
        .from("google_tokens")
        .upsert({
          user_id: session.user.id,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (dbError) {
        setEstado("error");
        setError("Error al guardar la conexión.");
        return;
      }

      router.replace("/perfil?google=conectado");
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        {estado === "procesando" ? (
          <>
            <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Conectando Google Calendar...</p>
          </>
        ) : (
          <>
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => router.replace("/perfil")}
              className="text-sm text-blue-900 underline"
            >
              Volver al perfil
            </button>
          </>
        )}
      </div>
    </div>
  );
}
