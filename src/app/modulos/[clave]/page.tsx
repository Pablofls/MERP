"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useModulos } from "@/features/modulos/hooks/useModulos";
import { REGISTRO_MODULOS } from "@/features/modulos/registro";
import { FICHAS } from "@/features/modulos/fichas";
import { CAPTURAS } from "@/features/modulos/tienda/capturas";
import EmptyState from "@/components/ui/EmptyState";

const CLASE_LABEL = { plantilla_pendientes: "Plantilla de pendientes", aplicacion: "Aplicación" } as const;

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="px-2 text-center min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{etiqueta}</p>
      <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">{valor}</p>
    </div>
  );
}

export default function FichaModuloPage() {
  const { clave } = useParams<{ clave: string }>();
  const { catalogo, estaActivo, activar, desactivar, sincronizado } = useModulos();
  const [ocupado, setOcupado] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const modulo = catalogo.find((m) => m.clave === clave);
  const ficha = FICHAS[clave];
  const ui = REGISTRO_MODULOS[clave];
  const Capturas = CAPTURAS[clave];

  if (!modulo || !ficha || !ui) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-6">
        <EmptyState title="Módulo no encontrado" description="Puede que ya no exista o que el enlace esté mal." />
        <div className="text-center">
          <Link href="/modulos" className="text-sm font-medium text-blue-900 hover:text-blue-700">
            Ver todos los módulos
          </Link>
        </div>
      </div>
    );
  }

  const activo = estaActivo(modulo.clave);

  async function cambiar(on: boolean) {
    if (!modulo) return;
    setOcupado(true);
    setFallo(null);
    const ok = on ? await activar(modulo.clave) : await desactivar(modulo.clave);
    if (!ok) setFallo(`No se pudo ${on ? "activar" : "desactivar"} ${modulo.nombre}. Intenta de nuevo.`);
    setOcupado(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-10 space-y-8">
      <Link href="/modulos" className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Módulos
      </Link>

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-sm [&_svg]:w-8 [&_svg]:h-8"
            style={{ backgroundColor: ficha.color }}
          >
            {ui.icono(true)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{modulo.nombre}</h1>
            <p className="text-sm text-gray-500">{ficha.subtitulo}</p>
            <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
              {CLASE_LABEL[modulo.clase]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
          {activo ? (
            <>
              <Link
                href={ui.ruta}
                className="bg-blue-900 text-white text-sm font-medium px-6 py-2 rounded-full hover:bg-blue-800 transition-colors"
              >
                Abrir
              </Link>
              <button
                onClick={() => cambiar(false)}
                disabled={ocupado || !sincronizado}
                className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-40 transition-colors"
              >
                {ocupado ? "Desactivando…" : "Desactivar"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => cambiar(true)}
                disabled={ocupado || !sincronizado}
                className="bg-blue-900 text-white text-sm font-medium px-6 py-2 rounded-full hover:bg-blue-800 disabled:opacity-40 transition-colors"
              >
                {ocupado ? "Activando…" : "Activar"}
              </button>
              <span className="text-xs text-gray-400">Gratis · sin perder datos</span>
            </>
          )}
        </div>
      </div>

      {fallo && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fallo}</div>}

      <div className="grid grid-cols-3 divide-x divide-gray-200 border-y border-gray-200 py-3">
        <Dato etiqueta="Tipo" valor={modulo.clase === "aplicacion" ? "Aplicación" : "Plantilla"} />
        <Dato etiqueta="En Inicio" valor={ficha.enInicio} />
        <Dato etiqueta="Al desactivar" valor="Tus datos se conservan" />
      </div>

      {Capturas && (
        <Seccion titulo="Vista previa">
          <Capturas />
        </Seccion>
      )}

      <Seccion titulo="Acerca de">
        <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">{ficha.acercaDe}</p>
      </Seccion>

      <Seccion titulo="Qué incluye">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ficha.funciones.map((f) => (
            <div key={f.titulo} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ backgroundColor: ficha.color }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{f.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Se integra con">
        <ul className="space-y-2">
          {ficha.integraciones.map((t) => (
            <li key={t} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: ficha.color }} />
              {t}
            </li>
          ))}
        </ul>
      </Seccion>
    </div>
  );
}
