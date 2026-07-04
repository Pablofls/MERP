import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getGoogleAccessToken(supabaseToken: string): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });

  const { data } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .maybeSingle();

  if (!data?.refresh_token) return null;

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: data.refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;
  const token = await res.json();
  return token.access_token ?? null;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseToken = authHeader.slice(7);
  const body = await req.json();
  const { action, taskId, titulo, descripcion, fechaLimite, completado } = body;

  const VALID_ACTIONS = ["crear", "actualizar", "eliminar"];
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Basic input sanity checks
  if (titulo !== undefined && (typeof titulo !== "string" || titulo.length > 1000)) {
    return NextResponse.json({ error: "Invalid titulo" }, { status: 400 });
  }
  if (descripcion !== undefined && (typeof descripcion !== "string" || descripcion.length > 8000)) {
    return NextResponse.json({ error: "Invalid descripcion" }, { status: 400 });
  }
  if (fechaLimite !== undefined && fechaLimite !== null && !/^\d{4}-\d{2}-\d{2}$/.test(fechaLimite)) {
    return NextResponse.json({ error: "Invalid fechaLimite" }, { status: 400 });
  }

  const accessToken = await getGoogleAccessToken(supabaseToken);
  if (!accessToken) {
    return NextResponse.json({ ok: false, motivo: "no_token" });
  }

  const BASE = "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks";

  if (action === "crear") {
    if (!titulo?.trim()) return NextResponse.json({ error: "titulo required" }, { status: 400 });
    const taskBody: Record<string, string> = { title: titulo };
    if (descripcion) taskBody.notes = descripcion;
    if (fechaLimite) taskBody.due = `${fechaLimite}T00:00:00.000Z`;

    const res = await fetch(BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskBody),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Google Tasks crear error:", JSON.stringify(err));
      return NextResponse.json({ ok: false, motivo: "api_error" });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, taskId: data.id });
  }

  if ((action === "actualizar" || action === "eliminar") && !taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  if (action === "actualizar") {
    const patch: Record<string, string> = {};
    if (completado !== undefined) patch.status = completado ? "completed" : "needsAction";
    if (titulo) patch.title = titulo;
    if (descripcion !== undefined) patch.notes = descripcion ?? "";
    if (fechaLimite !== undefined) patch.due = fechaLimite ? `${fechaLimite}T00:00:00.000Z` : "";

    await fetch(`${BASE}/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "eliminar") {
    await fetch(`${BASE}/${encodeURIComponent(taskId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
