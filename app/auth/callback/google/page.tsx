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
    if (!code) {
      setEstado("error");
      setError("No se recibió código de autorización.");
      return;
    }

    async function handleCallback() {
      const redirectUri = `${window.location.origin}/auth/callback/google`;

      // Intercambiar code por tokens (server-side para proteger client_secret)
      const exchangeRes = await fetch("/api/google/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (!exchangeRes.ok) {
        const err = await exchangeRes.json();
        setEstado("error");
        setError(err.error ?? "Error al conectar con Google.");
        return;
      }

      const tokens = await exchangeRes.json();

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEstado("error");
        setError("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }

      // Guardar tokens en Supabase
      const { error: dbError } = await supabase
        .from("google_tokens")
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
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
