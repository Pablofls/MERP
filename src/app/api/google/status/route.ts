import { NextRequest, NextResponse } from "next/server";
import { obtenerGoogleAccessToken, requireAuth } from "@/features/google/server/google-auth";
import { checkRateLimit } from "@/lib/server/rate-limit";

// GET /api/google/status — comprueba que la conexión con Google funcione de verdad
// (no solo que exista la fila en google_tokens).
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(`gstatus:${ip}`, 30, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabaseToken = await requireAuth(req.headers.get("Authorization"));
  if (!supabaseToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resultado = await obtenerGoogleAccessToken(supabaseToken);
  if (!("motivo" in resultado)) return NextResponse.json({ conectado: true });
  if (resultado.motivo === "sin_conexion") return NextResponse.json({ conectado: false });
  // Fallo transitorio: el cliente conserva el último estado conocido
  return NextResponse.json({ error: "No se pudo verificar" }, { status: 503 });
}
