"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Prenda } from "@/lib/types";
import type { CambiosPrenda } from "../hooks/usePrendas";
import { normalizarAltoCm } from "../lib/catalogo";
import { cargarImagen, prepararParaEditar, puntosRectangulo, recortarPoligono, type ImagenEditable, type Recorte } from "../lib/recorte";
import AjusteTamano from "./AjusteTamano";
import Recortador, { type Contorno } from "./Recortador";
import SelectorCategoria from "./SelectorCategoria";

interface Props {
  prenda: Prenda | null;
  onClose: () => void;
  onGuardar: (prenda: Prenda, cambios: CambiosPrenda) => Promise<boolean>;
  onEliminar: (prenda: Prenda) => Promise<boolean>;
}

type RecortePendiente = Recorte & { url: string };

const BOTON_SECUNDARIO =
  "flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors";
const BOTON_PRIMARIO = "flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-40 transition-colors";

export default function DetallePrenda({ prenda, onClose, onGuardar, onEliminar }: Props) {
  return (
    <Modal open={!!prenda} onClose={onClose} title="Prenda" className="sm:max-w-2xl">
      {prenda && <Form key={prenda.id} prenda={prenda} onClose={onClose} onGuardar={onGuardar} onEliminar={onEliminar} />}
    </Modal>
  );
}

function Form({ prenda, onClose, onGuardar, onEliminar }: Omit<Props, "prenda"> & { prenda: Prenda }) {
  const [categoria, setCategoria] = useState<string | null>(prenda.categoria);
  const [nombre, setNombre] = useState(prenda.nombre ?? "");
  const [altoCm, setAltoCm] = useState(prenda.altoCm);
  const [recorte, setRecorte] = useState<RecortePendiente | null>(null); // recortada de nuevo, sin guardar
  const [recortando, setRecortando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (recorte) URL.revokeObjectURL(recorte.url); }, [recorte]);

  // Lo que se ve: el recorte nuevo si lo hay, o el guardado
  const actual = recorte
    ? { src: recorte.url, ancho: recorte.ancho, alto: recorte.alto }
    : { src: prenda.imagenUrl, ancho: prenda.ancho, alto: prenda.alto };

  const cambio =
    categoria !== prenda.categoria ||
    nombre.trim() !== (prenda.nombre ?? "") ||
    !!recorte ||
    Math.abs(altoCm - prenda.altoCm) >= 0.1;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!categoria || !cambio) return;
    setOcupado(true);
    setError(null);
    const ok = await onGuardar(prenda, { categoria, nombre, altoCm, recorte: recorte ?? undefined });
    setOcupado(false);
    if (ok) onClose();
    else setError("No se pudieron guardar los cambios. Intenta de nuevo.");
  }

  async function eliminar() {
    setOcupado(true);
    const ok = await onEliminar(prenda);
    setOcupado(false);
    if (ok) onClose();
    else setError("No se pudo eliminar la prenda. Intenta de nuevo.");
  }

  if (recortando) {
    return (
      <EditorRecorte
        src={actual.src}
        onListo={(r) => {
          // Misma escala de la foto: el alto en cm se ajusta a lo que quedó del recorte
          setAltoCm(normalizarAltoCm((r.altoFuente * altoCm) / actual.alto));
          setRecorte(r);
          setRecortando(false);
        }}
        onCancelar={() => setRecortando(false)}
      />
    );
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <AjusteTamano
        key={actual.src}
        categoria={categoria ?? prenda.categoria}
        src={actual.src}
        ancho={actual.ancho}
        alto={actual.alto}
        altoCm={altoCm}
        onCambio={setAltoCm}
        altoMax="38dvh"
      />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setRecortando(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 bg-white px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664" />
          </svg>
          Recortar de nuevo
        </button>
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
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={BOTON_SECUNDARIO}>
          Cerrar
        </button>
        <button type="submit" disabled={!categoria || !cambio || ocupado} className={BOTON_PRIMARIO}>
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <div className="border-t border-gray-100 pt-3">
        {confirmar ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 flex-1">¿Eliminar esta prenda? No se puede deshacer.</span>
            <button type="button" onClick={() => setConfirmar(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors">
              No
            </button>
            <button
              type="button"
              onClick={eliminar}
              disabled={ocupado}
              className="text-xs text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 px-3 py-1 rounded-md transition-colors"
            >
              Sí, eliminar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            className="w-full text-xs text-red-400 hover:text-red-600 py-1 transition-colors text-center"
          >
            Eliminar prenda
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * Vuelve a recortar una prenda ya recortada: se abre con un margen transparente y un contorno rectangular
 * alrededor; se ajustan sus esquinas o se reinicia para marcar otro.
 */
function EditorRecorte({
  src,
  onListo,
  onCancelar,
}: {
  src: string;
  onListo: (r: RecortePendiente) => void;
  onCancelar: () => void;
}) {
  const [trabajo, setTrabajo] = useState<ImagenEditable | null>(null);
  const [contorno, setContorno] = useState<Contorno | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    let url: string | null = null;
    prepararParaEditar(src)
      .then((t) => {
        url = t.url;
        if (vivo) setTrabajo(t);
        else URL.revokeObjectURL(t.url);
      })
      .catch(() => vivo && setError("No se pudo abrir la imagen para editarla. Revisa tu conexión."));
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  const inicial = useMemo<Contorno | null>(
    () => (trabajo ? { puntos: puntosRectangulo(trabajo.ancho, trabajo.alto, trabajo.margen, trabajo.margen), cerrado: true } : null),
    [trabajo],
  );

  async function listo() {
    if (!trabajo || !inicial || !contorno?.cerrado) return;
    const sinCambios =
      contorno.puntos.length === inicial.puntos.length &&
      contorno.puntos.every((p, i) => Math.abs(p.x - inicial.puntos[i].x) < 0.5 && Math.abs(p.y - inicial.puntos[i].y) < 0.5);
    if (sinCambios) {
      onCancelar();
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const img = await cargarImagen(trabajo.url);
      const r = await recortarPoligono(img, contorno.puntos);
      onListo({ ...r, url: URL.createObjectURL(r.blob) });
    } catch {
      setError("No se pudo recortar la imagen. Intenta de nuevo.");
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-4">
      {trabajo && inicial ? (
        <Recortador src={trabajo.url} inicial={inicial} onCambio={setContorno} />
      ) : (
        !error && <div className="h-64 rounded-lg bg-gray-100 animate-pulse" role="status" aria-label="Cargando" />
      )}
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancelar} disabled={ocupado} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
        <button type="button" onClick={listo} disabled={!contorno?.cerrado || ocupado} className={BOTON_PRIMARIO}>
          {ocupado ? "Recortando…" : "Listo"}
        </button>
      </div>
    </div>
  );
}
