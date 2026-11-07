"use client";
import { useUser } from "@/lib/context/AuthContext";
import { REGISTRO_MODULOS, moduloDeRuta } from "../registro";

/** Tamaño lógico de una pantalla de vista previa (ventana de escritorio). Se dibuja a escala. */
export const ANCHO_PANTALLA = 1280;
export const ALTO_PANTALLA = 800;

const MENU = [
  { ruta: "/", etiqueta: "Inicio" },
  { ruta: "/escolar", etiqueta: "Escolar" },
  { ruta: "/personal", etiqueta: "Personal" },
  { ruta: "/habitos", etiqueta: "Habitos" },
];

/** Copia estática del Sidebar (mismas clases), sin atajos ni consultas. */
function BarraLateral({ ruta }: { ruta: string }) {
  const user = useUser();
  // Módulos fuera del menú base (p. ej. Closet) se agregan al final, como al activarlos
  const clave = moduloDeRuta(ruta);
  const menu =
    clave && !MENU.some((m) => m.ruta === ruta)
      ? [...MENU, { ruta, etiqueta: REGISTRO_MODULOS[clave].etiqueta }]
      : MENU;
  const inicial = user?.email?.[0]?.toUpperCase() ?? "U";
  const tab = (activo: boolean) =>
    `px-3 py-2.5 rounded-lg text-base font-medium ${activo ? "text-gray-50" : "text-gray-900"}`;

  return (
    <aside className="flex flex-col w-56 flex-shrink-0 bg-gray-50 p-5">
      <div className="mb-10 mt-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900">MERP</span>
      </div>
      <nav className="flex flex-col gap-0.5 flex-1">
        {menu.map((m) => (
          <span key={m.ruta} className={tab(m.ruta === ruta)}>{m.etiqueta}</span>
        ))}
      </nav>
      <span className={tab(false)}>Módulos</span>
      <div className="flex items-center gap-3 px-3 py-2.5 mt-4">
        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{inicial}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">Perfil</p>
          <p className="text-[10px] text-gray-400">Google conectado</p>
        </div>
      </div>
    </aside>
  );
}

/**
 * Ventana de escritorio (barra del navegador + menú lateral de MERP) que muestra componentes
 * reales de la app en miniatura. El contenido es inerte: no recibe clics, foco ni atajos.
 */
export default function PantallaPreview({
  escala,
  ruta,
  children,
}: {
  escala: number;
  ruta: string;
  children: React.ReactNode;
}) {
  const host = typeof window !== "undefined" ? window.location.host : "merp";

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-md"
      style={{ width: ANCHO_PANTALLA * escala, height: ALTO_PANTALLA * escala }}
    >
      <div
        inert
        aria-hidden
        className="pointer-events-none select-none origin-top-left flex flex-col text-left"
        style={{ width: ANCHO_PANTALLA, height: ALTO_PANTALLA, transform: `scale(${escala})` }}
      >
        {/* Barra del navegador */}
        <div className="h-11 flex-shrink-0 flex items-center gap-4 px-4 bg-gray-100 border-b border-gray-200">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 max-w-xl mx-auto h-7 rounded-md bg-white border border-gray-200 flex items-center px-3 text-sm text-gray-500">
            {host}{ruta}
          </div>
          <div className="w-14" />
        </div>

        {/* App */}
        <div className="flex flex-1 min-h-0">
          <BarraLateral ruta={ruta} />
          <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
        </div>
      </div>
      {/* Desvanecido inferior: el contenido continúa como en la app */}
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
    </div>
  );
}
