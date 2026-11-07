// Recorte poligonal de una foto: lo que queda dentro del contorno se conserva y el resto queda transparente.
// Todo ocurre en el navegador con <canvas>; no hay procesamiento automático de la imagen.

export interface Punto {
  x: number; // px de la imagen original
  y: number;
}

export interface Recorte {
  blob: Blob; // image/webp (o image/png si el navegador no codifica WebP, p. ej. Safari)
  ancho: number;
  alto: number;
}

/** Lado mayor del recorte guardado: suficiente para el lienzo del outfit en pantallas retina. */
export const LADO_MAX_RECORTE = 800;

export function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

/** Contorno = la foto completa (para prendas que ya vienen sobre fondo liso). */
export function puntosRectangulo(ancho: number, alto: number): Punto[] {
  return [
    { x: 0, y: 0 },
    { x: ancho, y: 0 },
    { x: ancho, y: alto },
    { x: 0, y: alto },
  ];
}

function lienzo(ancho: number, alto: number) {
  const c = document.createElement("canvas");
  c.width = ancho;
  c.height = alto;
  return c;
}

function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));
}

/**
 * Recorta la imagen con el polígono y la reduce a `ladoMax`. El resultado mide lo que la caja del contorno
 * (sin márgenes vacíos) y tiene fondo transparente.
 */
export async function recortarPoligono(
  img: HTMLImageElement,
  puntos: Punto[],
  ladoMax = LADO_MAX_RECORTE,
): Promise<Recorte> {
  if (puntos.length < 3) throw new Error("El contorno necesita al menos 3 puntos");
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  const xs = puntos.map((p) => Math.min(W, Math.max(0, p.x)));
  const ys = puntos.map((p) => Math.min(H, Math.max(0, p.y)));
  const minX = Math.floor(Math.min(...xs));
  const minY = Math.floor(Math.min(...ys));
  const bw = Math.max(1, Math.ceil(Math.max(...xs)) - minX);
  const bh = Math.max(1, Math.ceil(Math.max(...ys)) - minY);

  // 1) Recorte a resolución completa (solo la caja del contorno)
  let actual = lienzo(bw, bh);
  const ctx = actual.getContext("2d")!;
  ctx.translate(-minX, -minY);
  ctx.beginPath();
  puntos.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0);

  // 2) Reducción a la mitad en pasos: evita bordes dentados al bajar mucho de tamaño (Safari)
  const escala = Math.min(1, ladoMax / Math.max(bw, bh));
  const ancho = Math.max(1, Math.round(bw * escala));
  const alto = Math.max(1, Math.round(bh * escala));
  while (actual.width / 2 > ancho) {
    const sig = lienzo(Math.round(actual.width / 2), Math.round(actual.height / 2));
    const c = sig.getContext("2d")!;
    c.imageSmoothingQuality = "high";
    c.drawImage(actual, 0, 0, sig.width, sig.height);
    actual.width = 0; // libera memoria (iOS limita el total de canvas)
    actual = sig;
  }
  const final = lienzo(ancho, alto);
  const cf = final.getContext("2d")!;
  cf.imageSmoothingQuality = "high";
  cf.drawImage(actual, 0, 0, ancho, alto);
  actual.width = 0;

  let blob = await aBlob(final, "image/webp", 0.9);
  if (!blob || blob.type !== "image/webp") blob = await aBlob(final, "image/png");
  final.width = 0;
  if (!blob) throw new Error("No se pudo generar el recorte");
  return { blob, ancho, alto };
}
