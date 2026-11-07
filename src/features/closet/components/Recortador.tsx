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
  previo: Contorno; // contorno antes de este toque (para cancelarlo si resulta ser un pellizco)
}

/** Zoom y desplazamiento de la foto dentro del marco: translate(tx, ty) scale(z), en px del marco. */
interface Vista {
  z: number;
  tx: number;
  ty: number;
}

type Pos = { x: number; y: number };

const LUPA = 112; // px de pantalla
const ZOOM_LUPA = 2.5; // aumento de la lupa respecto a la vista actual
const ZOOM_MAX = 8;
const PASO_ZOOM = 1.5; // botones +/− y teclas
const MAX_HISTORIAL = 60;
const VISTA_INICIAL: Vista = { z: 1, tx: 0, ty: 0 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const ruta = (ps: Punto[]) => ps.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join("");
const distancia = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y);
const medio = (a: Pos, b: Pos): Pos => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Editor de contorno poligonal: se toca alrededor de la prenda para ir marcando puntos y se cierra tocando
 * el primero. Los puntos se arrastran para ajustar y el punto medio de cada lado inserta uno nuevo.
 *
 * Precisión: zoom con dos dedos, ⌘/Ctrl + rueda (o pellizco del trackpad) y los botones +/−; la foto se mueve
 * con dos dedos, la rueda, Espacio + arrastrar o el modo mano. Mientras se coloca o arrastra un punto aparece
 * una lupa para que el dedo no tape lo que se marca.
 */
export default function Recortador({ src, inicial, onCambio, onErrorImagen, altoMax = "55dvh", vistaPrevia = false }: Props) {
  const marcoRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lupaRef = useRef<HTMLCanvasElement>(null);
  const arrastre = useRef<Arrastre | null>(null);
  const punteros = useRef(new Map<number, Pos>()); // dedos/punteros presionados (px del marco)
  const pellizco = useRef<{ dist0: number; medio0: Pos; vista0: Vista } | null>(null);
  const paneo = useRef<{ inicio: Pos; vista0: Vista } | null>(null);
  const multitoque = useRef(false); // tras un pellizco no se dibuja hasta levantar todos los dedos
  const espacio = useRef(false);

  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 }); // px del marco
  const [vista, setVista] = useState<Vista>(VISTA_INICIAL);
  const [modoMano, setModoMano] = useState(false);
  const [moviendo, setMoviendo] = useState(false); // paneo en curso o Espacio presionado (cursor)
  const [contorno, setContorno] = useState<Contorno>(inicial ?? CONTORNO_VACIO);
  const [historial, setHistorial] = useState<Contorno[]>([]);
  const [puntero, setPuntero] = useState<Punto | null>(null); // punto bajo el dedo (lupa)
  const [cursor, setCursor] = useState<Punto | null>(null); // mouse sin presionar (línea guía)

  const contornoRef = useRef(contorno);
  contornoRef.current = contorno;
  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const tamRef = useRef(tam);
  tamRef.current = tam;
  const onCambioRef = useRef(onCambio);
  onCambioRef.current = onCambio;

  useEffect(() => {
    onCambioRef.current?.(contorno);
  }, [contorno]);

  // Si la imagen ya estaba cargada al hidratar (p. ej. data: o caché), onLoad no se dispara
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) setDims({ w: img.naturalWidth, h: img.naturalHeight });
  }, [src]);

  useLayoutEffect(() => {
    const el = marcoRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setTam({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Zoom ──────────────────────────────────────────────────────────────────────────────────────
  /** Mantiene la foto cubriendo el marco (sin bordes vacíos) y el zoom entre 1× y ZOOM_MAX. */
  function limitar(v: Vista): Vista {
    const { w, h } = tamRef.current;
    const z = clamp(v.z, 1, ZOOM_MAX);
    return { z, tx: clamp(v.tx, w - w * z, 0), ty: clamp(v.ty, h - h * z, 0) };
  }

  /** Zoom a `z` dejando fijo el punto (fx, fy) del marco, partiendo de `base`. */
  function zoomA(base: Vista, z: number, fx: number, fy: number): Vista {
    const z2 = clamp(z, 1, ZOOM_MAX);
    const r = z2 / base.z;
    return limitar({ z: z2, tx: fx - (fx - base.tx) * r, ty: fy - (fy - base.ty) * r });
  }

  function zoomCentro(factor: number) {
    const { w, h } = tamRef.current;
    setVista((v) => zoomA(v, v.z * factor, w / 2, h / 2));
  }

  // Si el marco cambia de tamaño (rotar el teléfono), la vista se vuelve a acomodar
  useEffect(() => {
    setVista((v) => limitar(v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tam.w, tam.h]);

  // Rueda: ⌘/Ctrl + rueda o pellizco del trackpad = zoom; con zoom, la rueda mueve la foto.
  // Safari en Mac reporta el pellizco del trackpad como gesture*; en iPhone/iPad lo maneja el pellizco
  // con punteros, así que gesture* solo se usa si no hay dedos registrados.
  useEffect(() => {
    const el = marcoRef.current;
    if (!el || vistaPrevia || !dims) return;
    const rel = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onWheel = (e: WheelEvent) => {
      const escala = e.deltaMode === 1 ? 16 : 1;
      const p = rel(e);
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-clamp(e.deltaY * escala, -50, 50) * 0.01);
        setVista((v) => zoomA(v, v.z * factor, p.x, p.y));
        return;
      }
      if (vistaRef.current.z <= 1) return; // sin zoom, la rueda desplaza la ventana como siempre
      e.preventDefault();
      let dx = e.deltaX * escala;
      let dy = e.deltaY * escala;
      if (e.shiftKey && !dx) [dx, dy] = [dy, 0];
      setVista((v) => limitar({ ...v, tx: v.tx - dx, ty: v.ty - dy }));
    };

    let vistaGesto = VISTA_INICIAL;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      vistaGesto = vistaRef.current;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      if (punteros.current.size >= 2) return;
      const g = e as Event & { scale: number; clientX?: number; clientY?: number };
      const { w, h } = tamRef.current;
      const p = g.clientX !== undefined ? rel({ clientX: g.clientX, clientY: g.clientY ?? 0 }) : { x: w / 2, y: h / 2 };
      setVista(zoomA(vistaGesto, vistaGesto.z * g.scale, p.x, p.y));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart);
    el.addEventListener("gesturechange", onGestureChange);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaPrevia, dims]);

  // Px de imagen por px de pantalla (tamaño de los controles y radios de toque), con el zoom incluido
  const k = dims && tam.w ? dims.w / (tam.w * vista.z) : 1;

  const { puntos, cerrado } = contorno;

  // ── Historial ─────────────────────────────────────────────────────────────────────────────────
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

  /** Revierte el punto que empezó a colocar el primer dedo cuando en realidad era un pellizco. */
  function cancelarArrastre() {
    const a = arrastre.current;
    if (!a) return;
    arrastre.current = null;
    setPuntero(null);
    setContorno(a.previo);
    setHistorial((h) => h.slice(0, -1)); // quita la entrada que guardó este toque
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

  // Teclado: ⌘/Ctrl+Z deshace, Enter cierra, +/− zoom, 0 ajusta, Espacio sostenido mueve la foto
  const atajosRef = useRef({ deshacer, cerrar, zoomCentro });
  atajosRef.current = { deshacer, cerrar, zoomCentro };
  useEffect(() => {
    if (vistaPrevia) return;
    const enControl = (t: EventTarget | null) =>
      t instanceof HTMLInputElement || t instanceof HTMLButtonElement || t instanceof HTMLTextAreaElement;
    const abajo = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        atajosRef.current.deshacer();
        return;
      }
      if (enControl(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        atajosRef.current.cerrar();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        atajosRef.current.zoomCentro(PASO_ZOOM);
      } else if (e.key === "-") {
        e.preventDefault();
        atajosRef.current.zoomCentro(1 / PASO_ZOOM);
      } else if (e.key === "0") {
        e.preventDefault();
        setVista(VISTA_INICIAL);
      } else if (e.key === " ") {
        e.preventDefault();
        espacio.current = true;
        setMoviendo(true);
      }
    };
    const arriba = (e: KeyboardEvent) => {
      if (e.key === " ") {
        espacio.current = false;
        if (!paneo.current) setMoviendo(false);
      }
    };
    window.addEventListener("keydown", abajo);
    window.addEventListener("keyup", arriba);
    return () => {
      window.removeEventListener("keydown", abajo);
      window.removeEventListener("keyup", arriba);
    };
  }, [vistaPrevia]);

  // ── Punteros ──────────────────────────────────────────────────────────────────────────────────
  function enMarco(e: React.PointerEvent): Pos {
    const r = marcoRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function aImagen(e: React.PointerEvent): Punto {
    const r = svgRef.current!.getBoundingClientRect(); // ya incluye el zoom
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
      const d = distancia(p, q) / k;
      if (d < radio && d < mejor) {
        mejor = d;
        idx = i;
      }
    });
    return idx;
  }

  const medios = cerrado ? puntos.map((p, i) => medio(p, puntos[(i + 1) % puntos.length])) : [];

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (vistaPrevia || !dims) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // puntero ya liberado: se sigue sin captura
    }
    punteros.current.set(e.pointerId, enMarco(e));
    setCursor(null);

    // Segundo dedo: es un pellizco (zoom + mover), no un punto
    if (punteros.current.size === 2) {
      cancelarArrastre();
      paneo.current = null;
      const [a, b] = [...punteros.current.values()];
      pellizco.current = { dist0: Math.max(1, distancia(a, b)), medio0: medio(a, b), vista0: vistaRef.current };
      multitoque.current = true;
      return;
    }
    if (punteros.current.size > 2 || multitoque.current) return;

    // Mover la foto: modo mano, Espacio sostenido o botón central del mouse
    if (modoMano || espacio.current || (e.pointerType === "mouse" && e.button === 1)) {
      paneo.current = { inicio: enMarco(e), vista0: vistaRef.current };
      setMoviendo(true);
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const p = aImagen(e);
    const radio = e.pointerType === "mouse" ? 10 : 22;
    const origen = { x: e.clientX, y: e.clientY };
    const previo = contornoRef.current;

    const v = cercano(p, puntos, radio);
    if (v >= 0) {
      guardarHistorial();
      arrastre.current = { indice: v, origen, movido: false, nuevo: false, podriaCerrar: !cerrado && v === 0 && puntos.length >= 3, previo };
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
      arrastre.current = { indice: m + 1, origen, movido: false, nuevo: true, podriaCerrar: false, previo };
      setPuntero(medios[m]);
      return;
    }

    // Punto nuevo: sigue al dedo hasta soltar
    guardarHistorial();
    setContorno({ puntos: [...puntos, p], cerrado: false });
    arrastre.current = { indice: puntos.length, origen, movido: false, nuevo: true, podriaCerrar: false, previo };
    setPuntero(p);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (vistaPrevia || !dims) return;

    if (!punteros.current.has(e.pointerId)) {
      // Mouse sin presionar: línea guía del último punto al cursor
      if (e.pointerType === "mouse" && !cerrado && !modoMano && !espacio.current) setCursor(aImagen(e));
      return;
    }
    punteros.current.set(e.pointerId, enMarco(e));

    if (pellizco.current) {
      if (punteros.current.size < 2) return;
      const [a, b] = [...punteros.current.values()];
      const { dist0, medio0, vista0 } = pellizco.current;
      const z = clamp(vista0.z * (distancia(a, b) / dist0), 1, ZOOM_MAX);
      // El punto de la foto que estaba bajo el centro de los dedos los sigue
      const cx = (medio0.x - vista0.tx) / vista0.z;
      const cy = (medio0.y - vista0.ty) / vista0.z;
      const m = medio(a, b);
      setVista(limitar({ z, tx: m.x - cx * z, ty: m.y - cy * z }));
      return;
    }
    if (multitoque.current) return;

    if (paneo.current) {
      const { inicio, vista0 } = paneo.current;
      const p = enMarco(e);
      setVista(limitar({ ...vista0, tx: vista0.tx + p.x - inicio.x, ty: vista0.ty + p.y - inicio.y }));
      return;
    }

    const a = arrastre.current;
    if (!a) return;
    const p = aImagen(e);
    if (!a.movido && Math.hypot(e.clientX - a.origen.x, e.clientY - a.origen.y) > 4) a.movido = true;
    if (!a.movido && !a.nuevo) return;
    setContorno((c) => ({ ...c, puntos: c.puntos.map((q, i) => (i === a.indice ? p : q)) }));
    setPuntero(p);
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    punteros.current.delete(e.pointerId);

    if (pellizco.current || multitoque.current) {
      if (punteros.current.size < 2) pellizco.current = null;
      if (punteros.current.size === 0) {
        multitoque.current = false;
        if (!espacio.current) setMoviendo(false);
      }
      return;
    }
    if (paneo.current) {
      paneo.current = null;
      if (!espacio.current) setMoviendo(false);
      return;
    }

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

  // ── Lupa: porción ampliada alrededor del dedo, con el contorno y una mira ──────────────────────
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

    const lado = (LUPA / ZOOM_LUPA) * k; // px de imagen visibles en la lupa
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

  // La lupa va arriba a la izquierda, o a la derecha si el dedo está en esa esquina del marco
  const lupaDerecha =
    !!puntero && puntero.x / k + vista.tx < LUPA + 24 && puntero.y / k + vista.ty < LUPA + 24;

  const ayuda = cerrado
    ? "Arrastra los puntos para ajustar. Arrastra el punto medio de un lado para agregar otro."
    : puntos.length === 0
      ? "Toca alrededor de la prenda para ir marcando su contorno."
      : puntos.length < 3
        ? "Sigue marcando puntos alrededor de la prenda."
        : "Toca el primer punto (verde) para cerrar el contorno.";

  // Tamaños en px de imagen equivalentes a px de pantalla (constantes con cualquier zoom)
  const r = 6 * k;
  const trazo = (px: number) => px * k;
  const ultimo = puntos[puntos.length - 1];
  const mano = modoMano || moviendo;

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
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${vista.tx}px, ${vista.ty}px) scale(${vista.z})` }}
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
              className={cn(
                "absolute inset-0 w-full h-full",
                !vistaPrevia && (mano ? (paneo.current ? "cursor-grabbing" : "cursor-grab") : cerrado ? "cursor-default" : "cursor-crosshair"),
              )}
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
                  stroke="#fff" strokeWidth={trazo(1.5)} strokeDasharray={`${trazo(4)} ${trazo(4)}`}
                />
              )}

              {puntos.length > 1 && (
                <g fill="none" strokeLinejoin="round">
                  <path d={ruta(puntos) + (cerrado ? "Z" : "")} stroke="rgba(0,0,0,0.45)" strokeWidth={trazo(3.5)} />
                  <path d={ruta(puntos) + (cerrado ? "Z" : "")} stroke="#fff" strokeWidth={trazo(1.75)} />
                </g>
              )}

              {!vistaPrevia &&
                medios.map((m, i) => (
                  <circle key={`m${i}`} cx={m.x} cy={m.y} r={r * 0.7} fill="rgba(255,255,255,0.75)" stroke="#1e3a8a" strokeWidth={trazo(1)} />
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
                    strokeWidth={trazo(2)}
                  />
                );
              })}
            </svg>
          )}
        </div>

        {puntero && (
          <canvas
            ref={lupaRef}
            aria-hidden
            className={cn(
              "absolute top-2 z-10 rounded-full border-2 border-white shadow-lg pointer-events-none bg-gray-200",
              lupaDerecha ? "right-2" : "left-2",
            )}
            style={{ width: LUPA, height: LUPA }}
          />
        )}

        {/* Controles de zoom sobre la foto */}
        {!vistaPrevia && dims && (
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-0.5 rounded-full border border-gray-200 bg-white/90 p-0.5 shadow-sm backdrop-blur">
            <BotonZoom onClick={() => zoomCentro(1 / PASO_ZOOM)} disabled={vista.z <= 1} titulo="Alejar (−)">
              <path strokeLinecap="round" d="M5 12h14" />
            </BotonZoom>
            <button
              type="button"
              onClick={() => setVista(VISTA_INICIAL)}
              disabled={vista.z <= 1}
              title="Ajustar a la pantalla (0)"
              className="h-8 min-w-[3rem] rounded-full px-1 text-[11px] font-semibold tabular-nums text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              {Math.round(vista.z * 100)}%
            </button>
            <BotonZoom onClick={() => zoomCentro(PASO_ZOOM)} disabled={vista.z >= ZOOM_MAX} titulo="Acercar (+)">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </BotonZoom>
            <span className="mx-0.5 h-5 w-px bg-gray-200" />
            <BotonZoom onClick={() => setModoMano((m) => !m)} activo={modoMano} titulo="Mover la foto (o mantén Espacio)">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15"
              />
            </BotonZoom>
          </div>
        )}
      </div>

      {!vistaPrevia && (
        <>
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
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            Zoom: pellizca con dos dedos, usa +/− o ⌘/Ctrl + rueda. Para moverte: dos dedos, la rueda, Espacio + arrastrar o la mano.
          </p>
        </>
      )}
    </div>
  );
}

function BotonZoom({
  onClick,
  disabled,
  activo,
  titulo,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  activo?: boolean;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30",
        activo ? "bg-blue-900 text-white" : "text-gray-700 hover:bg-gray-100 disabled:hover:bg-transparent",
      )}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        {children}
      </svg>
    </button>
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
