"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Prenda } from "@/lib/types";
import type { CambiosPrenda } from "../hooks/usePrendas";
import { marcoDe, normalizarAltoCm } from "../lib/catalogo";
import { cargarImagen, prepararParaEditar, puntosRectangulo, recortarPoligono, type ImagenEditable, type Recorte } from "../lib/recorte";
import Recortador, { type Contorno, type Escala } from "./Recortador";
import SelectorCategoria from "./SelectorCategoria";
import VistaEnMarco from "./VistaEnMarco";

interface Props {
  prenda: Prenda | null;
  onClose: () => void;
  onGuardar: (prenda: Prenda, cambios: CambiosPrenda) => Promise<boolean>;
  onEliminar: (prenda: Prenda) => Promise<boolean>;
}

/** Cambios de la foto aún sin guardar: tamaño nuevo y, si se volvió a recortar, el recorte nuevo. */
interface FotoPendiente {
  altoCm: number;
  recorte?: Recorte & { url: string };
}

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
  const [foto, setFoto] = useState<FotoPendiente | null>(null);
  const [editando, setEditando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (foto?.recorte) URL.revokeObjectURL(foto.recorte.url); }, [foto]);

  // Lo que se ve: la foto pendiente si la hay, o la guardada
  const actual = foto?.recorte
    ? { src: foto.recorte.url, ancho: foto.recorte.ancho, alto: foto.recorte.alto }
    : { src: prenda.imagenUrl, ancho: prenda.ancho, alto: prenda.alto };
  const altoCm = foto?.altoCm ?? prenda.altoCm;
  const anchoCm = (altoCm * actual.ancho) / actual.alto;

  const cambio =
    categoria !== prenda.categoria || nombre.trim() !== (prenda.nombre ?? "") || !!foto?.recorte || altoCm !== prenda.altoCm;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!categoria || !cambio) return;
    setOcupado(true);
    setError(null);
    const ok = await onGuardar(prenda, { categoria, nombre, altoCm, recorte: foto?.recorte });
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

  if (editando && categoria) {
    return (
      <EditorFoto
        src={actual.src}
        altoCm={altoCm}
        categoria={categoria}
        onListo={(f) => {
          setFoto(f);
          setEditando(false);
        }}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="h-64 rounded-xl bg-stone-100 p-3">
        <VistaEnMarco categoria={categoria ?? prenda.categoria} src={actual.src} ancho={actual.ancho} alto={actual.alto} altoCm={altoCm} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span className="text-xs text-gray-500">
          Tamaño aprox. <span className="font-semibold text-gray-700">{Math.round(anchoCm)} × {Math.round(altoCm)} cm</span>
          {foto && <span className="text-amber-600"> · sin guardar</span>}
        </span>
        <button
          type="button"
          onClick={() => setEditando(true)}
          disabled={!categoria}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 bg-white px-3 py-1.5 rounded-full hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664" />
          </svg>
          Editar foto y tamaño
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
 * Edita una prenda ya recortada: el recorte se abre con un margen transparente para que quepa el marco. Se puede
 * cambiar el tamaño (modo Tamaño) o recortar otra vez (modo Contorno; arranca con un rectángulo alrededor).
 */
function EditorFoto({
  src,
  altoCm,
  categoria,
  onListo,
  onCancelar,
}: {
  src: string;
  altoCm: number;
  categoria: string;
  onListo: (f: FotoPendiente) => void;
  onCancelar: () => void;
}) {
  const [trabajo, setTrabajo] = useState<ImagenEditable | null>(null);
  const [contorno, setContorno] = useState<Contorno | null>(null);
  const [escala, setEscala] = useState<Escala | null>(null);
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

  // Contorno inicial = la prenda completa; escala = la guardada
  const inicio = useMemo(() => {
    if (!trabajo) return null;
    const { margen, ancho, alto } = trabajo;
    return {
      contorno: { puntos: puntosRectangulo(ancho, alto, margen, margen), cerrado: true } as Contorno,
      escala: { pxPorCm: alto / altoCm, cx: margen + ancho / 2, cy: margen + alto / 2, manual: true } as Escala,
    };
  }, [trabajo, altoCm]);

  async function listo() {
    if (!trabajo || !inicio || !contorno?.cerrado || !escala) return;
    const sinRecortar =
      contorno.puntos.length === inicio.contorno.puntos.length &&
      contorno.puntos.every((p, i) => Math.abs(p.x - inicio.contorno.puntos[i].x) < 0.5 && Math.abs(p.y - inicio.contorno.puntos[i].y) < 0.5);
    if (sinRecortar) {
      onListo({ altoCm: normalizarAltoCm(trabajo.alto / escala.pxPorCm) });
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const img = await cargarImagen(trabajo.url);
      const r = await recortarPoligono(img, contorno.puntos);
      onListo({ recorte: { ...r, url: URL.createObjectURL(r.blob) }, altoCm: normalizarAltoCm(r.altoFuente / escala.pxPorCm) });
    } catch {
      setError("No se pudo recortar la imagen. Intenta de nuevo.");
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-4">
      {trabajo && inicio ? (
        <Recortador
          src={trabajo.url}
          inicial={inicio.contorno}
          onCambio={setContorno}
          marco={marcoDe(categoria)}
          escalaInicial={inicio.escala}
          onEscala={setEscala}
          modoInicial="tamano"
          limites={{ x: trabajo.margen, y: trabajo.margen, ancho: trabajo.ancho, alto: trabajo.alto }}
        />
      ) : (
        !error && <div className="h-64 rounded-lg bg-gray-100 animate-pulse" role="status" aria-label="Cargando" />
      )}
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancelar} disabled={ocupado} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
        <button type="button" onClick={listo} disabled={!contorno?.cerrado || !escala || ocupado} className={BOTON_PRIMARIO}>
          {ocupado ? "Recortando…" : "Listo"}
        </button>
      </div>
    </div>
  );
}
