"use client";

/** Tamaño lógico de una pantalla de vista previa (un celular). Se dibuja a escala. */
export const ANCHO_PANTALLA = 390;
export const ALTO_PANTALLA = 720;

/**
 * Marco tipo celular que muestra componentes reales de la app en miniatura.
 * El contenido es inerte: no recibe clics, foco ni atajos, solo se ve.
 */
export default function PantallaPreview({ escala, children }: { escala: number; children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-[22px] border border-gray-200 bg-gray-50 shadow-sm"
      style={{ width: ANCHO_PANTALLA * escala, height: ALTO_PANTALLA * escala }}
    >
      <div
        inert
        aria-hidden
        className="pointer-events-none select-none origin-top-left"
        style={{ width: ANCHO_PANTALLA, height: ALTO_PANTALLA, transform: `scale(${escala})` }}
      >
        <div className="h-full overflow-hidden px-4 pt-6 pb-6 space-y-4 text-left">{children}</div>
      </div>
      {/* Desvanecido inferior: el contenido continúa como en la app */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
    </div>
  );
}
