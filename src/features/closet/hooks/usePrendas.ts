"use client";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/context/AuthContext";
import { useCachedList, ok } from "@/lib/cache/useCachedList";
import type { Prenda } from "@/lib/types";
import type { Recorte } from "../lib/recorte";

const BUCKET = "closet";
const COLUMNAS = "id,categoria_clave,nombre,imagen_path,ancho,alto";

type PrendaDB = {
  id: string;
  categoria_clave: string;
  nombre: string | null;
  imagen_path: string;
  ancho: number;
  alto: number;
};

/** URL pública del recorte (el bucket es público; la ruta lleva el UUID de la prenda, no se puede adivinar). */
function urlPublica(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function prendaFromDB(r: PrendaDB): Prenda {
  return {
    id: r.id,
    categoria: r.categoria_clave,
    nombre: r.nombre ?? undefined,
    imagenPath: r.imagen_path,
    imagenUrl: urlPublica(r.imagen_path),
    ancho: r.ancho,
    alto: r.alto,
  };
}

export const fetchPrendas = async (): Promise<Prenda[]> =>
  ok(
    await supabase.from("closet_prendas").select(COLUMNAS).order("created_at", { ascending: false }),
  ).map((r) => prendaFromDB(r as PrendaDB));

export interface DatosPrenda {
  categoria: string;
  nombre?: string;
}

export function usePrendas() {
  const user = useUser();
  const [prendas, setPrendas, cargando] = useCachedList<Prenda>("closet_prendas", fetchPrendas);

  /** Sube el recorte y registra la prenda. Devuelve un mensaje de error o null si se guardó. */
  async function agregarPrenda(recorte: Recorte, datos: DatosPrenda): Promise<string | null> {
    if (!user) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    const id = crypto.randomUUID();
    const ext = recorte.blob.type === "image/webp" ? "webp" : "png";
    const path = `${user.id}/${id}.${ext}`;

    const subida = await supabase.storage.from(BUCKET).upload(path, recorte.blob, {
      contentType: recorte.blob.type,
      cacheControl: "31536000", // la ruta nunca se reutiliza: caché inmutable
      upsert: false,
    });
    if (subida.error) return "No se pudo subir la imagen. Revisa tu conexión e intenta de nuevo.";

    const { data, error } = await supabase
      .from("closet_prendas")
      .insert({
        id,
        user_id: user.id,
        categoria_clave: datos.categoria,
        nombre: datos.nombre?.trim() || null,
        imagen_path: path,
        ancho: recorte.ancho,
        alto: recorte.alto,
      })
      .select(COLUMNAS)
      .single();

    if (error || !data) {
      await supabase.storage.from(BUCKET).remove([path]); // no dejar archivos huérfanos
      return "No se pudo guardar la prenda. Intenta de nuevo.";
    }
    setPrendas((prev) => [prendaFromDB(data as PrendaDB), ...prev]);
    return null;
  }

  async function editarPrenda(id: string, datos: DatosPrenda): Promise<boolean> {
    const { data, error } = await supabase
      .from("closet_prendas")
      .update({ categoria_clave: datos.categoria, nombre: datos.nombre?.trim() || null })
      .eq("id", id)
      .select(COLUMNAS)
      .single();
    if (error || !data) return false;
    setPrendas((prev) => prev.map((p) => (p.id === id ? prendaFromDB(data as PrendaDB) : p)));
    return true;
  }

  async function eliminarPrenda(prenda: Prenda): Promise<boolean> {
    setPrendas((prev) => prev.filter((p) => p.id !== prenda.id));
    const { error } = await supabase.from("closet_prendas").delete().eq("id", prenda.id);
    if (error) {
      setPrendas((prev) => (prev.some((p) => p.id === prenda.id) ? prev : [prenda, ...prev]));
      return false;
    }
    // La fila ya no existe; si borrar el archivo falla solo queda un objeto huérfano en el bucket
    await supabase.storage.from(BUCKET).remove([prenda.imagenPath]);
    return true;
  }

  return { prendas, cargando, agregarPrenda, editarPrenda, eliminarPrenda };
}
