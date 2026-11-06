"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { ALTO_PANTALLA, ANCHO_PANTALLA } from "../../components/PantallaPreview";

function Cargando() {
  return (
    <div className="flex gap-4 overflow-hidden pb-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 rounded-xl bg-gray-100 animate-pulse max-w-[85%]"
          style={{ width: ANCHO_PANTALLA * 0.45, aspectRatio: `${ANCHO_PANTALLA} / ${ALTO_PANTALLA}` }}
        />
      ))}
    </div>
  );
}

/** Carrusel de capturas de cada módulo, cargado solo al abrir su ficha. */
export const CAPTURAS: Record<string, ComponentType> = {
  escolar: dynamic(() => import("./escolar"), { ssr: false, loading: Cargando }),
  personal: dynamic(() => import("./personal"), { ssr: false, loading: Cargando }),
  habitos: dynamic(() => import("./habitos"), { ssr: false, loading: Cargando }),
};
