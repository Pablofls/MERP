import { cn } from "@/lib/utils";
import { marcoDe } from "../lib/catalogo";

const MARGEN = 1.1;

/**
 * La prenda a su tamaño real dentro de la silueta de su categoría (todo en cm, en un solo SVG que se ajusta
 * al contenedor). Sirve para confirmar el tamaño antes de guardar.
 */
export default function VistaEnMarco({
  categoria,
  src,
  ancho,
  alto,
  altoCm,
  className,
}: {
  categoria: string;
  src: string;
  ancho: number; // px de la imagen (solo la proporción)
  alto: number;
  altoCm: number;
  className?: string;
}) {
  const m = marcoDe(categoria);
  const anchoCm = (altoCm * ancho) / alto;
  const W = Math.max(m.ancho, anchoCm) * MARGEN;
  const H = Math.max(m.alto, altoCm) * MARGEN;
  const mx = (W - m.ancho) / 2;
  const my = (H - m.alto) / 2;
  const silueta = m.silueta.map(([u, v], i) => `${i ? "L" : "M"}${mx + u * m.ancho} ${my + v * m.alto}`).join("") + "Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full h-full", className)} role="img" aria-label="Prenda dentro de su marco de tamaño">
      <path
        d={silueta}
        fill="rgba(245,158,11,0.08)"
        stroke="#f59e0b"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <image
        href={src}
        x={(W - anchoCm) / 2}
        y={(H - altoCm) / 2}
        width={anchoCm}
        height={altoCm}
        preserveAspectRatio="xMidYMid meet"
        className="drop-shadow-md"
      />
    </svg>
  );
}
