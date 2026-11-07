"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { puntosRectangulo, type Punto } from "../lib/recorte";

export interface Contorno {
  puntos: Punto[]; // px de la imagen original
  cerrado: boolean;
}

export const CONTORNO_VACIO: Contorno = { puntos: [], cerrado: false };

interface Props {
  src: string;
  /** Contorno con el que arranca (p. ej. al volver del paso siguiente) */
  inicial?: Contorno;
  onCambio?: (c: Contorno) => void;
  onErrorImagen?: () => void;
  /** Alto máximo del área de la foto (CSS) */
  altoMax?: string;
  /** Solo muestra el contorno, sin interacción (vista previa de la tienda) */
  vistaPrevia?: boolean;
}

interface Arrastre {
  indice: number;
  origen: { x: number; y: number }; // px de pantalla al presionar
  movido: boolean;
  nuevo: boolean; // el punto se creó con este toque
  podriaCerrar: boolean; // tocó el primer punto con el contorno abierto
}

const LUPA = 112; // px de pantalla
const ZOOM = 2.5;
const MAX_HISTORIAL = 60;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const ruta = (ps: Punto[]) => ps.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join("");

/**
 * Editor de contorno poligonal: se toca alrededor de la prenda para ir marcando puntos y se cierra tocando
 * el primero. Los puntos se arrastran para ajustar y el punto medio de cada lado inserta uno nuevo.
 * Mientras se coloca o arrastra un punto aparece una lupa para precisión con el dedo.
 */
export default function Recortador({ src, inicial, onCambio, onErrorImagen, altoMax = "55dvh", vistaPrevia = false }: Props) {
  const marcoRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lupaRef = useRef<HTMLCanvasElement>(null);
  const arrastre = useRef<Arrastre | null>(null);

  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [anchoPx, setAnchoPx] = useState(0);
  const [contorno, setContorno] = useState<Contorno>(inicial ?? CONTORNO_VACIO);
  const [historial, setHistorial] = useState<Contorno[]>([]);
  const [puntero, setPuntero] = useState<Punto | null>(null); // punto bajo el dedo (lupa)
  const [cursor, setCursor] = useState<Punto | null>(null); // mouse sin presionar (línea guía)

  const contornoRef = useRef(contorno);
  contornoRef.current = contorno;
  const onCambioRef = useRef(onCambio);
  onCambioRef.current = onCambio;

  useEffect(() => {
    onCambioRef.current?.(contorno);
  }, [contorno]);

  // Px de imagen por px de pantalla (para tamaños de los controles y radios de toque)
  useLayoutEffect(() => {
    const el = marcoRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAnchoPx(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const k = dims && anchoPx ? dims.w / anchoPx : 1;

  const { puntos, cerrado } = contorno;

  function guardarHistorial() {
    const actual = contornoRef.current;
    setHistorial((h) => [...h.slice(-MAX_HISTORIAL + 1), actual]);
  }

  function deshacer() {
    const previo = historial[historial.length - 1];
    if (!previo) return;
    setContorno(previo);
    setHistorial(historial.slice(0, -1));
  }

  function cerrar() {
    if (contorno.cerrado || contorno.puntos.length < 3) return;
    guardarHistorial();
    setContorno({ puntos: contorno.puntos, cerrado: true });
  }

  function reiniciar() {
    if (!contorno.puntos.length) return;
    guardarHistorial();
    setContorno(CONTORNO_VACIO);
  }

  function fotoCompleta() {
    if (!dims) return;
    guardarHistorial();
    setContorno({ puntos: puntosRectangulo(dims.w, dims.h), cerrado: true });
  }

  // Atajos: Cmd/Ctrl+Z deshace, Enter cierra el contorno
  const atajosRef = useRef({ deshacer, cerrar });
  atajosRef.current = { deshacer, cerrar };
  useEffect(() => {
    if (vistaPrevia) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        atajosRef.current.deshacer();
      } else if (
        e.key === "Enter" &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        atajosRef.current.cerrar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [vistaPrevia]);

  function aImagen(e: React.PointerEvent): Punto {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - r.left) / r.width) * dims!.w, 0, dims!.w),
      y: clamp(((e.clientY - r.top) / r.height) * dims!.h, 0, dims!.h),
    };
  }

  /** Índice del punto más cercano dentro del radio (px de pantalla), o -1. */
  function cercano(p: Punto, candidatos: Punto[], radio: number): number {
    let idx = -1;
    let mejor = Infinity;
    candidatos.forEach((q, i) => {
      const d = Math.hypot(p.x - q.x, p.y - q.y) / k;
      if (d < radio && d < mejor) {
        mejor = d;
        idx = i;
      }
    });
    return idx;
  }

  const medios = cerrado
    ? puntos.map((p, i) => {
        const q = puntos[(i + 1) % puntos.length];
        return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      })
    : [];

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (vistaPrevia || !dims || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = aImagen(e);
    const radio = e.pointerType === "mouse" ? 10 : 22;
    const origen = { x: e.clientX, y: e.clientY };
    setCursor(null);

    const v = cercano(p, puntos, radio);
    if (v >= 0) {
      guardarHistorial();
      arrastre.current = { indice: v, origen, movido: false, nuevo: false, podriaCerrar: !cerrado && v === 0 && puntos.length >= 3 };
      setPuntero(puntos[v]);
      return;
    }

    if (cerrado) {
      const m = cercano(p, medios, radio);
      if (m < 0) return;
      guardarHistorial();
      const nuevos = [...puntos];
      nuevos.splice(m + 1, 0, medios[m]);
      setContorno({ puntos: nuevos, cerrado: true });
      arrastre.current = { indice: m + 1, origen, movido: false, nuevo: true, podriaCerrar: false };
      setPuntero(medios[m]);
      return;
    }

    // Punto nuevo: sigue al dedo hasta soltar
    guardarHistorial();
    setContorno({ puntos: [...puntos, p], cerrado: false });
    arrastre.current = { indice: puntos.length, origen, movido: false, nuevo: true, podriaCerrar: false };
    setPuntero(p);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (vistaPrevia || !dims) return;
    const p = aImagen(e);
    const a = arrastre.current;
    if (!a) {
      if (e.pointerType === "mouse" && !cerrado) setCursor(p);
      return;
    }
    if (!a.movido && Math.hypot(e.clientX - a.origen.x, e.clientY - a.origen.y) > 4) a.movido = true;
    if (!a.movido && !a.nuevo) return;
    setContorno((c) => ({ ...c, puntos: c.puntos.map((q, i) => (i === a.indice ? p : q)) }));
    setPuntero(p);
  }

  function onPointerUp() {
    const a = arrastre.current;
    arrastre.current = null;
    setPuntero(null);
    if (!a) return;
    if (a.podriaCerrar && !a.movido) {
      // Tocó el primer punto: cierra (el historial ya guardó el estado abierto)
      setContorno((c) => ({ ...c, cerrado: true }));
    } else if (!a.movido && !a.nuevo) {
      // Toque sobre un punto sin moverlo: no hubo cambio
      setHistorial((h) => h.slice(0, -1));
    }
  }

  // Lupa: porción ampliada de la foto alrededor del dedo, con el contorno y una mira
  useEffect(() => {
    const canvas = lupaRef.current;
    const img = imgRef.current;
    if (!puntero || !canvas || !img || !dims) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = LUPA * dpr;
    canvas.height = LUPA * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const lado = (LUPA / ZOOM) * k; // px de imagen visibles en la lupa
    const sx = puntero.x - lado / 2;
    const sy = puntero.y - lado / 2;
    const f = LUPA / lado;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, LUPA, LUPA);
    // Solo la parte dentro de la imagen (Safari no dibuja si el origen se sale de los bordes)
    const x0 = Math.max(0, sx), y0 = Math.max(0, sy);
    const x1 = Math.min(dims.w, sx + lado), y1 = Math.min(dims.h, sy + lado);
    if (x1 > x0 && y1 > y0) {
      ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0, (x0 - sx) * f, (y0 - sy) * f, (x1 - x0) * f, (y1 - y0) * f);
    }

    const aLupa = (q: Punto) => [(q.x - sx) * f, (q.y - sy) * f] as const;
    if (puntos.length > 1) {
      ctx.beginPath();
      puntos.forEach((q, i) => (i ? ctx.lineTo(...aLupa(q)) : ctx.moveTo(...aLupa(q))));
      if (cerrado) ctx.closePath();
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const c = LUPA / 2;
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c - 10, c); ctx.lineTo(c - 3, c);
    ctx.moveTo(c + 3, c); ctx.lineTo(c + 10, c);
    ctx.moveTo(c, c - 10); ctx.lineTo(c, c - 3);
    ctx.moveTo(c, c + 3); ctx.lineTo(c, c + 10);
    ctx.stroke();
  }, [puntero, puntos, cerrado, dims, k]);

  // La lupa va arriba a la izquierda, o a la derecha si el dedo está en esa esquina
  const lupaDerecha = !!puntero && puntero.x / k < LUPA + 24 && puntero.y / k < LUPA + 24;

  const ayuda = cerrado
    ? "Arrastra los puntos para ajustar. Arrastra el punto medio de un lado para agregar otro."
    : puntos.length === 0
      ? "Toca alrededor de la prenda para ir marcando su contorno."
      : puntos.length < 3
        ? "Sigue marcando puntos alrededor de la prenda."
        : "Toca el primer punto (verde) para cerrar el contorno.";

  const r = 6 * k; // radio de los puntos en px de imagen (≈6 px en pantalla)
  const ultimo = puntos[puntos.length - 1];

  return (
    <div className="space-y-3">
      {!vistaPrevia && <p className="text-xs text-gray-500 text-center min-h-[2rem] flex items-center justify-center">{ayuda}</p>}

      <div
        ref={marcoRef}
        className="relative mx-auto select-none overflow-hidden rounded-lg bg-gray-100"
        style={
          dims
            ? { aspectRatio: `${dims.w} / ${dims.h}`, width: `min(100%, calc(${altoMax} * ${dims.w / dims.h}))` }
            : { width: "100%", minHeight: 160 }
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt="Foto de la prenda"
          draggable={false}
          onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          onError={onErrorImagen}
          className="block w-full h-full pointer-events-none"
        />

        {dims && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${dims.w} ${dims.h}`}
            className={cn("absolute inset-0 w-full h-full", !vistaPrevia && (cerrado ? "cursor-default" : "cursor-crosshair"))}
            style={{ touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={() => setCursor(null)}
          >
            {/* Fuera del contorno se oscurece */}
            {cerrado && puntos.length >= 3 && (
              <path d={`M0 0H${dims.w}V${dims.h}H0Z${ruta(puntos)}Z`} fillRule="evenodd" fill="rgba(17,24,39,0.6)" />
            )}

            {/* Línea guía del último punto al mouse */}
            {!cerrado && ultimo && cursor && (
              <line
                x1={ultimo.x} y1={ultimo.y} x2={cursor.x} y2={cursor.y}
                stroke="#fff" strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke"
              />
            )}

            {puntos.length > 1 && (
              <g fill="none" strokeLinejoin="round">
                <path d={ruta(puntos) + (cerrado ? "Z" : "")} stroke="rgba(0,0,0,0.45)" strokeWidth={3.5} vectorEffect="non-scaling-stroke" />
                <path d={ruta(puntos) + (cerrado ? "Z" : "")} stroke="#fff" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
              </g>
            )}

            {!vistaPrevia &&
              medios.map((m, i) => (
                <circle key={`m${i}`} cx={m.x} cy={m.y} r={r * 0.7} fill="rgba(255,255,255,0.75)" stroke="#1e3a8a" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              ))}

            {puntos.map((p, i) => {
              const cierre = !cerrado && i === 0 && puntos.length >= 3;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={cierre ? r * 1.5 : r}
                  fill={cierre ? "#10b981" : "#fff"}
                  stroke={cierre ? "#fff" : "#1e3a8a"}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        )}

        {puntero && (
          <canvas
            ref={lupaRef}
            aria-hidden
            className={cn(
              "absolute top-2 rounded-full border-2 border-white shadow-lg pointer-events-none bg-gray-200",
              lupaDerecha ? "right-2" : "left-2",
            )}
            style={{ width: LUPA, height: LUPA }}
          />
        )}
      </div>

      {!vistaPrevia && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <BotonHerramienta onClick={deshacer} disabled={!historial.length} titulo="Deshacer (⌘Z)" icono="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" texto="Deshacer" />
          <BotonHerramienta onClick={reiniciar} disabled={!puntos.length} titulo="Borrar el contorno" icono="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" texto="Reiniciar" />
          <BotonHerramienta onClick={fotoCompleta} disabled={!dims} titulo="Usar la foto completa, sin recortar" icono="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" texto="Foto completa" />
          {!cerrado && puntos.length >= 3 && (
            <button
              type="button"
              onClick={cerrar}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
            >
              Cerrar contorno
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BotonHerramienta({
  onClick,
  disabled,
  titulo,
  icono,
  texto,
}: {
  onClick: () => void;
  disabled?: boolean;
  titulo: string;
  icono: string; // path de 24×24
  texto: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white px-3 py-1.5 rounded-full hover:bg-gray-50 disabled:opacity-40 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icono} />
      </svg>
      {texto}
    </button>
  );
}
