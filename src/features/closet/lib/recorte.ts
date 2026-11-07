// Recorte poligonal de una foto: lo que queda dentro del contorno se conserva y el resto queda transparente.
// Todo ocurre en el navegador con <canvas>; no hay procesamiento automático de la imagen.

export interface Punto {
  x: number; // px de la imagen original
  y: number;
}

export interface Recorte {
  blob: Blob; // image/webp (o image/png si el navegador no codifica WebP, p. ej. Safari)
  ancho: number; // px del archivo
  alto: number;
  /** Alto del contenido en px de la imagen de origen (para convertir a cm con la escala del marco) */
  altoFuente: number;
}

/** Lado mayor del recorte guardado: suficiente para el lienzo del outfit en pantallas retina. */
export const LADO_MAX_RECORTE = 800;

export function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    // Imágenes del bucket: con CORS para poder leerlas en un canvas (Supabase responde con
    // Access-Control-Allow-Origin: *). blob:/data: son del mismo origen.
    if (/^https?:/.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

/** Contorno = un rectángulo (la foto completa, o la prenda guardada dentro de su margen al editarla). */
export function puntosRectangulo(ancho: number, alto: number, x = 0, y = 0): Punto[] {
  return [
    { x, y },
    { x: x + ancho, y },
    { x: x + ancho, y: y + alto },
    { x, y: y + alto },
  ];
}

/** Caja que encierra los puntos, recortada a los bordes de la imagen. */
export function cajaDe(puntos: Punto[], W = Infinity, H = Infinity) {
  const xs = puntos.map((p) => Math.min(W, Math.max(0, p.x)));
  const ys = puntos.map((p) => Math.min(H, Math.max(0, p.y)));
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, ancho: Math.max(...xs) - x, alto: Math.max(...ys) - y };
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

/** Caja de los píxeles visibles (alfa > umbral), o null si todo es transparente. */
function cajaVisible(canvas: HTMLCanvasElement) {
  const { width: w, height: h } = canvas;
  const datos = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (datos[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

/**
 * Recorta la imagen con el polígono y la reduce a `ladoMax`. El resultado mide lo que el contenido visible
 * (sin márgenes transparentes) y tiene fondo transparente.
 */
export async function recortarPoligono(
  img: HTMLImageElement,
  puntos: Punto[],
  ladoMax = LADO_MAX_RECORTE,
): Promise<Recorte> {
  if (puntos.length < 3) throw new Error("El contorno necesita al menos 3 puntos");
  const caja = cajaDe(puntos, img.naturalWidth, img.naturalHeight);
  const minX = Math.floor(caja.x);
  const minY = Math.floor(caja.y);
  const bw = Math.max(1, Math.ceil(caja.x + caja.ancho) - minX);
  const bh = Math.max(1, Math.ceil(caja.y + caja.alto) - minY);

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
  let final = lienzo(ancho, alto);
  const cf = final.getContext("2d")!;
  cf.imageSmoothingQuality = "high";
  cf.drawImage(actual, 0, 0, ancho, alto);
  actual.width = 0;

  // 3) Sin márgenes transparentes (al editar una prenda, el contorno puede abarcar zonas vacías)
  const visible = cajaVisible(final);
  if (!visible) throw new Error("El recorte quedó vacío");
  if (visible.ancho < ancho || visible.alto < alto) {
    const ajustado = lienzo(visible.ancho, visible.alto);
    ajustado.getContext("2d")!.drawImage(final, visible.x, visible.y, visible.ancho, visible.alto, 0, 0, visible.ancho, visible.alto);
    final.width = 0;
    final = ajustado;
  }

  let blob = await aBlob(final, "image/webp", 0.9);
  if (!blob || blob.type !== "image/webp") blob = await aBlob(final, "image/png");
  const resultado = { ancho: final.width, alto: final.height, altoFuente: final.height * (bh / alto) };
  final.width = 0;
  if (!blob) throw new Error("No se pudo generar el recorte");
  return { blob, ...resultado };
}

export interface ImagenEditable {
  url: string; // object URL de la imagen con margen transparente
  margen: number; // px agregados en cada lado
  ancho: number; // px de la imagen original (sin margen)
  alto: number;
}

/**
 * Prepara un recorte ya guardado (o uno pendiente, blob:) para volver a editarlo: le agrega un margen
 * transparente alrededor, para que el marco de tamaño (que suele ser más grande que la prenda) quepa en el editor.
 * Se carga con <img> y no con fetch: la CSP permite esas URLs en img-src.
 */
export async function prepararParaEditar(src: string): Promise<ImagenEditable> {
  const img = await cargarImagen(src);
  const ancho = img.naturalWidth;
  const alto = img.naturalHeight;
  const margen = Math.round(Math.max(ancho, alto) * 0.35);
  const c = lienzo(ancho + margen * 2, alto + margen * 2);
  c.getContext("2d")!.drawImage(img, margen, margen);
  const blob = await aBlob(c, "image/png");
  c.width = 0;
  if (!blob) throw new Error("No se pudo preparar la imagen");
  return { url: URL.createObjectURL(blob), margen, ancho, alto };
}
