"use client";
import Link from "next/link";
import { useState } from "react";
import { useModulos } from "../hooks/useModulos";
import { REGISTRO_MODULOS, IconoModulos } from "../registro";

/**
 * Muestra la sección solo si su módulo está activo; si no, ofrece activarlo.
 * Se usa en el layout de cada ruta de módulo, así las páginas no cambian.
 */
export default function ModuloGuard({ clave, children }: { clave: string; children: React.ReactNode }) {
  const { catalogo, estaActivo, activar, sincronizado } = useModulos();
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState(false);

  if (estaActivo(clave)) return <>{children}</>;

  const nombre = catalogo.find((m) => m.clave === clave)?.nombre ?? clave;
  const icono = REGISTRO_MODULOS[clave]?.icono(false);

  async function handleActivar() {
    setActivando(true);
    setError(false);
    const ok = await activar(clave);
    if (!ok) setError(true);
    setActivando(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-6 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
        {icono}
      </div>
      <h1 className="text-lg font-bold text-gray-900">{nombre} está desactivado</h1>
      <p className="text-sm text-gray-500 mt-1.5">
        Actívalo para volver a usar esta sección. Tus datos se conservan.
      </p>
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={handleActivar}
          disabled={activando || !sincronizado}
          className="bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-40 transition-colors"
        >
          {activando ? "Activando…" : `Activar ${nombre}`}
        </button>
        <Link
          href={`/modulos/${clave}`}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <IconoModulos className="w-4 h-4" />
          Ver qué incluye
        </Link>
      </div>
      {error && <p className="text-xs text-red-600 mt-3">No se pudo activar. Intenta de nuevo.</p>}
    </div>
  );
}
