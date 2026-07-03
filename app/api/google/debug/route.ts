import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ paso: "auth", error: "No se recibió token de Supabase" }, { status: 401 });
  }

  const supabaseToken = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });

  // Paso 1: verificar usuario
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ paso: "usuario", error: userError?.message ?? "Sin usuario" });
  }

  // Paso 2: leer google_tokens
  const { data: tokenRow, error: tokenError } = await supabase
    .from("google_tokens")
    .select("*")
    .maybeSingle();

  if (tokenError) {
    return NextResponse.json({ paso: "leer_tokens", error: tokenError.message, user: user.email });
  }
  if (!tokenRow) {
    return NextResponse.json({ paso: "leer_tokens", error: "No hay fila en google_tokens para este usuario", user: user.email });
  }
  if (!tokenRow.refresh_token) {
    return NextResponse.json({
      paso: "refresh_token",
      error: "La fila existe pero refresh_token es null",
      scope: tokenRow.scope,
      user: user.email,
    });
  }

  // Paso 3: obtener access_token fresco
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: tokenRow.refresh_token,
    grant_type: "refresh_token",
  });

  const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const refreshData = await refreshRes.json();
  if (!refreshRes.ok) {
    return NextResponse.json({
      paso: "refresh_token_google",
      error: refreshData.error_description ?? refreshData.error,
      scope_guardado: tokenRow.scope,
      user: user.email,
    });
  }

  const accessToken = refreshData.access_token;

  // Paso 4: crear tarea de prueba en Google Tasks
  const taskRes = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: "[TEST MERP] Verificación de conexión" }),
  });

  const taskData = await taskRes.json();
  if (!taskRes.ok) {
    return NextResponse.json({
      paso: "crear_tarea",
      error: taskData.error?.message ?? JSON.stringify(taskData),
      scope_del_token: refreshData.scope,
      scope_guardado: tokenRow.scope,
      user: user.email,
    });
  }

  // Eliminar tarea de prueba
  await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(taskData.id)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return NextResponse.json({
    paso: "ok",
    mensaje: "Todo funciona correctamente",
    scope_del_token: refreshData.scope,
    scope_guardado: tokenRow.scope,
    tarea_creada: taskData.title,
    user: user.email,
  });
}
