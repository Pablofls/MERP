"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { DatosPrenda } from "../hooks/usePrendas";
import { cargarImagen, recortarPoligono, type Recorte } from "../lib/recorte";
import Recortador, { CONTORNO_VACIO, type Contorno } from "./Recortador";
import SelectorCategoria from "./SelectorCategoria";

type Paso = "foto" | "recorte" | "detalles";
const PASOS: { clave: Paso; titulo: string }[] = [
  { clave: "foto", titulo: "Foto" },
  { clave: "recorte", titulo: "Recorte" },
  { clave: "detalles", titulo: "Detalles" },
];

type Guardar = (recorte: Recorte, datos: DatosPrenda) => Promise<string | null>;

/** Foto → recorte poligonal a mano → categoría y nombre. Al guardar vuelve al inicio para cargar otra. */
export default function AgregarPrenda({ open, onClose, onGuardar }: { open: boolean; onClose: () => void; onGuardar: Guardar }) {
  return (
    <Modal open={open} onClose={onClose} title="Agregar prenda" className="sm:max-w-2xl">
      <Flujo onListo={onClose} onGuardar={onGuardar} />
    </Modal>
  );
}

function Flujo({ onListo, onGuardar }: { onListo: () => void; onGuardar: Guardar }) {
  const [paso, setPaso] = useState<Paso>("foto");
  const [foto, setFoto] = useState<string | null>(null); // object URL de la foto elegida
  const [contorno, setContorno] = useState<Contorno>(CONTORNO_VACIO);
  const [recorte, setRecorte] = useState<(Recorte & { url: string }) | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [guardadas, setGuardadas] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  // Libera las URLs locales al cambiar de foto/recorte o al cerrar
  useEffect(() => () => { if (foto) URL.revokeObjectURL(foto); }, [foto]);
  useEffect(() => () => { if (recorte) URL.revokeObjectURL(recorte.url); }, [recorte]);

  function elegirArchivo(file: File | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) {
      setError("Ese archivo no es una imagen.");
      return;
    }
    setError(null);
    setContorno(CONTORNO_VACIO);
    setFoto(URL.createObjectURL(file));
    setPaso("recorte");
  }

  function fotoIlegible() {
    setFoto(null);
    setPaso("foto");
    setError("No se pudo abrir esta imagen. Prueba con una foto JPG o PNG.");
  }

  async function siguiente() {
    if (!foto || !contorno.cerrado) return;
    setOcupado(true);
    setError(null);
    try {
      const img = await cargarImagen(foto);
      const r = await recortarPoligono(img, contorno.puntos);
      setRecorte({ ...r, url: URL.createObjectURL(r.blob) });
      setPaso("detalles");
    } catch {
      setError("No se pudo recortar la imagen. Intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  async function guardar() {
    if (!recorte || !categoria) return;
    setOcupado(true);
    setError(null);
    const fallo = await onGuardar(recorte, { categoria, nombre });
    setOcupado(false);
    if (fallo) {
      setError(fallo);
      return;
    }
    // Lista para la siguiente; se conserva la categoría por si se cargan varias del mismo tipo
    setGuardadas((n) => n + 1);
    setFoto(null);
    setRecorte(null);
    setContorno(CONTORNO_VACIO);
    setNombre("");
    setPaso("foto");
  }

  const indice = PASOS.findIndex((p) => p.clave === paso);

  return (
    <div className="space-y-4">
      {/* Pasos */}
      <ol className="flex items-center justify-center gap-2 text-[11px] font-medium">
        {PASOS.map((p, i) => (
          <li key={p.clave} className="flex items-center gap-2">
            {i > 0 && <span className="w-6 h-px bg-gray-200" />}
            <span className={cn("flex items-center gap-1.5", i <= indice ? "text-blue-900" : "text-gray-400")}>
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                  i < indice ? "bg-blue-900 text-white" : i === indice ? "border-2 border-blue-900" : "border border-gray-300",
                )}
              >
                {i < indice ? "✓" : i + 1}
              </span>
              {p.titulo}
            </span>
          </li>
        ))}
      </ol>

      {paso === "foto" && (
        <>
          {guardadas > 0 && (
            <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <span className="text-xs text-emerald-800">
                ✓ {guardadas === 1 ? "Prenda guardada" : `${guardadas} prendas guardadas`}. Agrega otra o termina.
              </span>
              <button type="button" onClick={onListo} className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">
                Listo
              </button>
            </div>
          )}
          <label
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              elegirArchivo(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-12 px-4 text-center cursor-pointer transition-colors",
              arrastrando ? "border-blue-900 bg-blue-50" : "border-gray-200 hover:bg-gray-50",
            )}
          >
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                elegirArchivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <span className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-800">Elegir foto</span>
            <span className="text-xs text-gray-400 max-w-xs">
              Toma una foto o elige una de tu galería. En la compu también puedes arrastrarla aquí.
            </span>
          </label>
          <p className="text-[11px] text-gray-400 text-center">
            Consejo: extiende la prenda sobre un fondo liso y con buena luz; así es más fácil marcar su contorno.
          </p>
        </>
      )}

      {paso === "recorte" && foto && (
        <>
          <Recortador key={foto} src={foto} inicial={contorno} onCambio={setContorno} onErrorImagen={fotoIlegible} />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setFoto(null); setPaso("foto"); }}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Otra foto
            </button>
            <button
              type="button"
              onClick={siguiente}
              disabled={!contorno.cerrado || ocupado}
              className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-40 transition-colors"
            >
              {ocupado ? "Recortando…" : "Siguiente"}
            </button>
          </div>
        </>
      )}

      {paso === "detalles" && recorte && (
        <>
          <div className="h-56 rounded-xl bg-stone-100 flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={recorte.url} alt="Recorte de la prenda" className="max-h-full max-w-full object-contain drop-shadow-md" />
          </div>
          <SelectorCategoria valor={categoria} onChange={setCategoria} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre (opcional)</label>
            <input
              type="text"
              value={nombre}
              maxLength={80}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Playera blanca básica"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPaso("recorte")}
              disabled={ocupado}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Ajustar recorte
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!categoria || ocupado}
              className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-40 transition-colors"
            >
              {ocupado ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
