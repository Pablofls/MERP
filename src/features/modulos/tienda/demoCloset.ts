// Prendas de ejemplo para la ficha de Closet: siluetas SVG (como data: URIs) que hacen de recortes sin fondo.
import type { Prenda } from "@/lib/types";
import type { Outfit } from "@/features/closet/lib/generarOutfit";
import type { Contorno } from "@/features/closet/components/Recortador";
import { altoCmAjustado } from "@/features/closet/lib/catalogo";

const svg = (ancho: number, alto: number, cuerpo: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    // width/height explícitos: sin ellos el navegador reporta 300×150 como tamaño natural del SVG
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" stroke-linejoin="round" stroke-linecap="round">${cuerpo}</svg>`,
  )}`;

function prenda(id: string, categoria: string, nombre: string, ancho: number, alto: number, cuerpo: string): Prenda {
  // Tamaño = encajada en el marco de su categoría, como el ajuste automático al recortar
  const altoCm = altoCmAjustado(categoria, ancho, alto);
  return { id: `demo-${id}`, categoria, nombre, imagenPath: "", imagenUrl: svg(ancho, alto, cuerpo), ancho, alto, altoCm };
}

// Playera (capa 1): también se usa en la "foto" del recortador
const PLAYERA_PATH = "M78 14 L44 26 L8 62 L34 96 L54 82 L54 206 L166 206 L166 82 L186 96 L212 62 L176 26 L142 14 C134 30 86 30 78 14 Z";
const playera = (relleno: string, borde: string, cuello: string) =>
  `<path d="${PLAYERA_PATH}" fill="${relleno}" stroke="${borde}" stroke-width="2"/>` +
  `<path d="M78 14 C86 30 134 30 142 14" fill="none" stroke="${cuello}" stroke-width="4"/>` +
  `<path d="M54 84 L54 112 M166 84 L166 112" stroke="${borde}" stroke-width="1.5" opacity=".6"/>`;

const mangaLarga = (relleno: string, borde: string) =>
  `<path d="M80 26 L44 40 L14 140 L12 196 L38 198 L56 108 L58 226 L172 226 L174 108 L192 198 L218 196 L216 140 L186 40 L150 26 C140 50 90 50 80 26 Z" fill="${relleno}" stroke="${borde}" stroke-width="2"/>` +
  `<path d="M12 186 L38 188 M192 188 L218 186 M58 214 L172 214" stroke="${borde}" stroke-width="2" opacity=".7"/>`;

export const PRENDAS_DEMO: Prenda[] = [
  prenda("gorra", "gorras", "Gorra roja", 220, 132,
    `<path d="M30 104 C30 40 70 20 112 20 C154 20 186 44 188 104 Z" fill="#b23a48" stroke="#94303c" stroke-width="2"/>` +
    `<path d="M112 22 C100 50 98 80 100 104 M112 22 C130 50 140 80 146 104" fill="none" stroke="#94303c" stroke-width="2"/>` +
    `<circle cx="112" cy="20" r="6" fill="#94303c"/>` +
    `<path d="M150 98 C180 96 214 104 216 120 C190 126 150 120 126 110 Z" fill="#a1323f" stroke="#86293a" stroke-width="2"/>` +
    `<path d="M30 104 L188 104 L188 112 L30 112 Z" fill="#94303c"/>`),
  prenda("playera", "camisas", "Playera blanca", 220, 220, playera("#f5f2ec", "#d6cfc2", "#cfc8ba")),
  prenda("camisa", "camisas", "Camisa azul", 220, 230,
    `<path d="M80 16 L46 28 L10 70 L10 150 L34 152 L50 92 L54 218 L166 218 L170 92 L186 152 L210 150 L210 70 L174 28 L140 16 L110 34 Z" fill="#b8cde4" stroke="#9cb3cc" stroke-width="2"/>` +
    `<path d="M80 16 L110 34 L94 50 Z M140 16 L110 34 L126 50 Z" fill="#cddcec" stroke="#9cb3cc" stroke-width="2"/>` +
    `<path d="M110 34 L110 218" stroke="#9cb3cc" stroke-width="2"/>` +
    [62, 96, 130, 164, 198].map((y) => `<circle cx="116" cy="${y}" r="3" fill="#f4f8fc" stroke="#9cb3cc"/>`).join("") +
    `<path d="M130 70 L156 70 L156 92 L130 92 Z" fill="none" stroke="#9cb3cc" stroke-width="2"/>`),
  prenda("sudadera", "sueteres", "Sudadera gris", 230, 236,
    `<path d="M78 30 C80 0 150 0 152 30 Z" fill="#6f747d"/>` +
    mangaLarga("#8d929b", "#73787f") +
    `<path d="M84 28 C92 58 138 58 146 28 C138 42 92 42 84 28 Z" fill="#5c6068"/>` +
    `<path d="M104 52 L102 86 M126 52 L128 86" stroke="#eef0f2" stroke-width="2.5"/>` +
    `<path d="M80 168 L150 168 L160 204 L70 204 Z" fill="none" stroke="#73787f" stroke-width="2"/>`),
  prenda("sueter", "sueteres", "Suéter crema", 230, 236,
    mangaLarga("#e4d4bb", "#c9b799") +
    `<path d="M80 26 C90 50 140 50 150 26" fill="none" stroke="#c9b799" stroke-width="6"/>` +
    `<path d="M95 80 L95 200 M115 76 L115 204 M135 80 L135 200" stroke="#d4c2a4" stroke-width="3" opacity=".7"/>`),
  prenda("chamarra", "chamarras", "Chamarra olivo", 230, 236,
    `<path d="M82 20 L46 34 L16 140 L14 200 L40 202 L58 104 L60 228 L170 228 L172 104 L190 202 L216 200 L214 140 L184 34 L148 20 L115 40 Z" fill="#5f6f45" stroke="#4a5835" stroke-width="2"/>` +
    `<path d="M82 20 L115 40 L98 62 L84 34 Z M148 20 L115 40 L132 62 L146 34 Z" fill="#4f5d39" stroke="#435030" stroke-width="2"/>` +
    `<path d="M115 40 L115 228" stroke="#cfc6a6" stroke-width="2.5"/>` +
    `<path d="M72 140 L104 140 L104 154 L72 154 Z M126 140 L158 140 L158 154 L126 154 Z" fill="#56653f" stroke="#435030" stroke-width="2"/>`),
  prenda("jeans", "pantalones", "Jeans", 160, 260,
    `<path d="M24 8 L136 8 L148 252 L94 252 L82 70 L78 70 L66 252 L12 252 Z" fill="#3f5f8a" stroke="#31507a" stroke-width="2"/>` +
    `<path d="M24 8 L136 8 L137 24 L23 24 Z" fill="#36557d"/>` +
    `<path d="M80 24 Q79 58 72 66 M30 26 Q44 48 62 26 M130 26 Q116 48 98 26 M14 238 L66 238 M94 238 L147 238" fill="none" stroke="#2c4568" stroke-width="2"/>`),
  prenda("shorts", "shorts", "Shorts caqui", 180, 136,
    `<path d="M22 8 L158 8 L172 116 L104 126 L90 56 L76 126 L8 116 Z" fill="#c9b48a" stroke="#ac9870" stroke-width="2"/>` +
    `<path d="M22 8 L158 8 L159 22 L21 22 Z" fill="#b9a479"/>` +
    `<path d="M90 22 L90 50 M30 24 Q42 44 60 24 M150 24 Q138 44 120 24" fill="none" stroke="#a08c65" stroke-width="2"/>`),
  prenda("tenis", "calzado", "Tenis blancos", 230, 130,
    `<g transform="translate(18 -16)" opacity=".92"><path d="M14 84 C14 60 30 48 54 46 L82 42 C96 58 120 66 150 70 C182 74 204 80 206 96 L206 100 L14 100 Z" fill="#ececec" stroke="#cfcfcf" stroke-width="2"/><path d="M10 98 L210 98 L208 110 C150 114 60 114 12 110 Z" fill="#dcd9d5"/></g>` +
    `<path d="M14 92 C14 68 30 56 54 54 L82 50 C96 66 120 74 150 78 C182 82 204 88 206 104 L206 108 L14 108 Z" fill="#fafafa" stroke="#d4d4d4" stroke-width="2"/>` +
    `<path d="M10 106 L210 106 L208 120 C150 124 60 124 12 120 Z" fill="#e7e5e4" stroke="#cfcac4" stroke-width="2"/>` +
    `<path d="M60 90 C100 96 140 88 172 84" fill="none" stroke="#1e3a8a" stroke-width="5"/>` +
    `<path d="M80 58 L96 70 M88 54 L104 66 M96 52 L112 64" stroke="#bdbdbd" stroke-width="2.5"/>`),
  prenda("bolsa", "accesorios", "Tote café", 170, 190,
    `<path d="M52 62 C52 12 118 12 118 62" fill="none" stroke="#7a4f2c" stroke-width="8"/>` +
    `<path d="M22 58 L148 58 L160 182 L10 182 Z" fill="#a87447" stroke="#8a5e37" stroke-width="2"/>` +
    `<path d="M22 72 L148 72" stroke="#8a5e37" stroke-width="2" opacity=".7"/>`),
];

const p = (id: string) => PRENDAS_DEMO.find((x) => x.id === `demo-${id}`)!;

export const OUTFIT_DEMO: Outfit = { gorra: p("gorra"), capa1: p("playera"), bottom: p("jeans"), calzado: p("tenis"), accesorio: p("bolsa") };
export const OUTFIT_CAPAS_DEMO: Outfit = { capa1: p("camisa"), capa2: p("sudadera"), capa3: p("chamarra"), bottom: p("jeans"), calzado: p("tenis") };

// "Foto" de una playera sobre una mesa, y el contorno ya trazado alrededor
const DX = 130;
const DY = 60;
export const FOTO_RECORTE_DEMO = svg(
  480,
  340,
  `<rect width="480" height="340" fill="#cdbfa9"/>` +
    [40, 110, 180, 250, 320].map((y) => `<path d="M0 ${y} L480 ${y + 6}" stroke="#bfae95" stroke-width="3"/>`).join("") +
    `<g transform="translate(${DX + 5} ${DY + 7})" opacity=".18"><path d="${PLAYERA_PATH}" fill="#000"/></g>` +
    `<g transform="translate(${DX} ${DY})">${playera("#f5f2ec", "#d6cfc2", "#cfc8ba")}</g>`,
);
export const CONTORNO_DEMO: Contorno = {
  cerrado: true,
  puntos: [
    [78, 14], [60, 20], [44, 26], [26, 44], [8, 62], [21, 79], [34, 96], [54, 82], [54, 146], [54, 206],
    [110, 206], [166, 206], [166, 146], [166, 82], [186, 96], [199, 79], [212, 62], [194, 44], [176, 26],
    [160, 20], [142, 14], [128, 24], [110, 27], [92, 24],
  ].map(([x, y]) => ({ x: x + DX, y: y + DY })),
};
