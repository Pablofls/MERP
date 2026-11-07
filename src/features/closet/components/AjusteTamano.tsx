"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { altoCmAjustado, marcoDe, normalizarAltoCm } from "../lib/catalogo";

interface Props {
  categoria: string;
  /** Recorte de la prenda (fondo transparente) */
  src: string;
  ancho: number; // px del recorte (solo la proporción)
  alto: number;
  /** Alto inicial en cm */
  altoCm: number;
  onCambio?: (altoCm: number) => void;
  /** Alto máximo del escenario (CSS) */
  altoMax?: string;
  /** Solo muestra (vista previa de la tienda) */
  soloLectura?: boolean;
}

type Pos = { x: number; y: number };
type Gesto =
  | { tipo: "mover"; inicio: Pos; centro0: Pos }
  | { tipo: "escalar"; opuesta: Pos }
  | { tipo: "pellizco"; dist0: number; tam0: number };

const HOLGURA = 1.5; // el escenario mide la silueta × 1.5, para que la prenda pueda crecer
const PROPORCION_MIN = 0.62;
const PROPORCION_MAX = 1.7;
const COLOR = "#f59e0b";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const distancia = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Ajuste de tamaño: la silueta de la categoría (a tamaño real, en cm) queda fija de fondo y la prenda recortada
 * se mueve y escala encima hasta que coincide con ella. Todo el escenario está en cm, así que el alto de la
 * prenda en el escenario es su alto real.
 */
export default function AjusteTamano({ categoria, src, ancho, alto, altoCm, onCambio, altoMax = "46dvh", soloLectura = false }: Props) {
  const m = marcoDe(categoria);
  let W = m.ancho * HOLGURA;
  let H = m.alto * HOLGURA;
  if (W / H < PROPORCION_MIN) W = H * PROPORCION_MIN;
  else if (W / H > PROPORCION_MAX) H = W / PROPORCION_MAX;
  const centroSilueta = { x: W / 2, y: H / 2 };
  const silueta =
    m.silueta.map(([u, v], i) => `${i ? "L" : "M"}${(W - m.ancho) / 2 + u * m.ancho} ${(H - m.alto) / 2 + v * m.alto}`).join("") + "Z";

  const encajado = altoCmAjustado(categoria, ancho, alto);
  const [rango] = useState(() => ({
    min: Math.min(altoCm, Math.max(1, encajado * 0.25)),
    max: Math.max(altoCm, Math.min(300, encajado * 3)),
  }));

  const escenarioRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const punteros = useRef(new Map<number, Pos>());
  const gesto = useRef<Gesto | null>(null);
  const multitoque = useRef(false);

  const [tamCm, setTamCm] = useState(altoCm);
  const [centro, setCentro] = useState<Pos>(centroSilueta);
  const [anchoPx, setAnchoPx] = useState(0);

  const tamRef = useRef(tamCm);
  tamRef.current = tamCm;
  const onCambioRef = useRef(onCambio);
  onCambioRef.current = onCambio;

  useEffect(() => {
    onCambioRef.current?.(normalizarAltoCm(tamCm));
  }, [tamCm]);

  // Otra categoría = otra silueta: la prenda vuelve al centro (su tamaño no cambia)
  useEffect(() => {
    setCentro({ x: W / 2, y: H / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  useLayoutEffect(() => {
    const el = escenarioRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAnchoPx(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const limitarTam = (t: number) => clamp(t, rango.min, rango.max);

  // ⌘/Ctrl + rueda o pellizco del trackpad escalan la prenda (Safari en Mac: gesture*)
  useEffect(() => {
    const el = escenarioRef.current;
    if (!el || soloLectura) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = Math.exp(-clamp(e.deltaY * (e.deltaMode === 1 ? 16 : 1), -50, 50) * 0.01);
      setTamCm((t) => limitarTam(t * factor));
    };
    let tam0 = 0;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      tam0 = tamRef.current;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      if (punteros.current.size >= 2) return; // en iPhone lo maneja el pellizco con punteros
      setTamCm(limitarTam(tam0 * (e as Event & { scale: number }).scale));
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
  }, [soloLectura]);

  const proporcion = ancho / alto;
  const h = tamCm;
  const w = tamCm * proporcion;
  const caja = { x: centro.x - w / 2, y: centro.y - h / 2, w, h };
  const esquinas: Pos[] = [
    { x: caja.x, y: caja.y },
    { x: caja.x + w, y: caja.y },
    { x: caja.x + w, y: caja.y + h },
    { x: caja.x, y: caja.y + h },
  ];
  const k = anchoPx ? W / anchoPx : 1; // cm por px de pantalla

  function aCm(e: React.PointerEvent): Pos {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (soloLectura) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // sin captura
    }
    const p = aCm(e);
    punteros.current.set(e.pointerId, p);

    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      gesto.current = { tipo: "pellizco", dist0: Math.max(0.5, distancia(a, b)), tam0: tamRef.current };
      multitoque.current = true;
      return;
    }
    if (punteros.current.size > 2 || multitoque.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const radio = (e.pointerType === "mouse" ? 10 : 22) * k;
    const i = esquinas.findIndex((q) => distancia(p, q) < radio);
    gesto.current = i >= 0 ? { tipo: "escalar", opuesta: esquinas[(i + 2) % 4] } : { tipo: "mover", inicio: p, centro0: centro };
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (soloLectura || !punteros.current.has(e.pointerId)) return;
    const p = aCm(e);
    punteros.current.set(e.pointerId, p);
    const g = gesto.current;
    if (!g) return;

    if (g.tipo === "pellizco") {
      if (punteros.current.size < 2) return;
      const [a, b] = [...punteros.current.values()];
      setTamCm(limitarTam(g.tam0 * (distancia(a, b) / g.dist0)));
    } else if (g.tipo === "mover") {
      setCentro({ x: clamp(g.centro0.x + p.x - g.inicio.x, 0, W), y: clamp(g.centro0.y + p.y - g.inicio.y, 0, H) });
    } else {
      // Escala uniforme dejando fija la esquina opuesta
      const o = g.opuesta;
      const nuevoAlto = limitarTam(Math.max(Math.abs(p.y - o.y), Math.abs(p.x - o.x) / proporcion));
      const nuevoAncho = nuevoAlto * proporcion;
      setTamCm(nuevoAlto);
      setCentro({ x: o.x + ((p.x >= o.x ? 1 : -1) * nuevoAncho) / 2, y: o.y + ((p.y >= o.y ? 1 : -1) * nuevoAlto) / 2 });
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    punteros.current.delete(e.pointerId);
    if (punteros.current.size === 0) {
      gesto.current = null;
      multitoque.current = false;
    } else if (gesto.current?.tipo === "pellizco") {
      gesto.current = null; // el dedo que queda no mueve la prenda hasta soltar todo
    }
  }

  function encajar() {
    setTamCm(limitarTam(encajado));
    setCentro(centroSilueta);
  }

  const anchoCm = Math.round(w);
  const altoRedondo = Math.round(h);

  return (
    <div className="space-y-3">
      {!soloLectura && (
        <p className="text-xs text-gray-500 text-center">
          Ajusta tu prenda a la silueta de referencia: arrástrala para moverla y cambia su tamaño con la barra, las esquinas o
          pellizcando.
        </p>
      )}

      <div
        ref={escenarioRef}
        className="relative mx-auto select-none overflow-hidden rounded-xl bg-stone-100"
        style={{ aspectRatio: `${W} / ${H}`, width: `min(100%, calc(${altoMax} * ${W / H}))` }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={cn("absolute inset-0 w-full h-full", !soloLectura && "cursor-move")}
          style={{ touchAction: soloLectura ? undefined : "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Silueta de referencia: relleno detrás de la prenda, contorno encima para verla siempre */}
          <path d={silueta} fill="rgba(245,158,11,0.12)" />
          <image href={src} x={caja.x} y={caja.y} width={w} height={h} preserveAspectRatio="none" className="drop-shadow-md" />
          <path
            d={silueta}
            fill="none"
            stroke={COLOR}
            strokeWidth={2}
            strokeDasharray="7 5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.95}
            pointerEvents="none"
          />
          {!soloLectura && (
            <g pointerEvents="none">
              <rect
                x={caja.x} y={caja.y} width={w} height={h}
                fill="none" stroke="#1e3a8a" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity={0.6}
              />
              {esquinas.map((q, i) => (
                <rect
                  key={i}
                  x={q.x - 6 * k} y={q.y - 6 * k} width={12 * k} height={12 * k} rx={2 * k}
                  fill="#fff" stroke="#1e3a8a" strokeWidth={1.5} vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      {!soloLectura && (
        <>
          <div className="flex items-center gap-3 max-w-sm mx-auto">
            <BotonTam etiqueta="Más chica" onClick={() => setTamCm((t) => limitarTam(t * 0.95))}>
              <path strokeLinecap="round" d="M5 12h14" />
            </BotonTam>
            <input
              type="range"
              min={rango.min}
              max={rango.max}
              step={0.1}
              value={tamCm}
              onChange={(e) => setTamCm(Number(e.target.value))}
              aria-label="Tamaño de la prenda"
              className="flex-1 accent-blue-900"
            />
            <BotonTam etiqueta="Más grande" onClick={() => setTamCm((t) => limitarTam(t * 1.05))}>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </BotonTam>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="text-xs text-gray-500">
              Tu prenda: <span className="font-semibold text-gray-700">{anchoCm} × {altoRedondo} cm</span>
              <span className="text-gray-400"> · silueta {m.ancho} × {m.alto} cm</span>
            </span>
            <button
              type="button"
              onClick={encajar}
              className="text-xs font-medium text-gray-700 border border-gray-200 bg-white px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              Encajar en la silueta
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function BotonTam({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="w-8 h-8 flex-shrink-0 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        {children}
      </svg>
    </button>
  );
}
