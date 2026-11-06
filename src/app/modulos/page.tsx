"use client";
import { useState } from "react";
import { useModulos } from "@/features/modulos/hooks/useModulos";
import TarjetaModulo from "@/features/modulos/components/TarjetaModulo";
import type { Modulo } from "@/lib/types";

function Grupo({
  titulo,
  descripcion,
  modulos,
  children,
}: {
  titulo: string;
  descripcion: string;
  modulos: Modulo[];
  children: (m: Modulo) => React.ReactNode;
}) {
  if (modulos.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{titulo}</h2>
      <p className="text-xs text-gray-400 mt-1 mb-3">{descripcion}</p>
      <div className="grid gap-3 sm:grid-cols-2">{modulos.map(children)}</div>
    </section>
  );
}

export default function ModulosPage() {
  const { catalogo, estaActivo, activar, desactivar, sincronizado, error } = useModulos();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  async function cambiar(m: Modulo, on: boolean) {
    setOcupado(m.clave);
    setFallo(null);
    const ok = on ? await activar(m.clave) : await desactivar(m.clave);
    if (!ok) setFallo(`No se pudo ${on ? "activar" : "desactivar"} ${m.nombre}. Intenta de nuevo.`);
    setOcupado(null);
  }

  const tarjeta = (m: Modulo) => (
    <TarjetaModulo
      key={m.clave}
      modulo={m}
      activo={estaActivo(m.clave)}
      deshabilitado={!sincronizado || ocupado === m.clave}
      onCambiar={(on) => cambiar(m, on)}
    />
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-6 space-y-8" data-tutorial-id="modulos-section">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Módulos</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Arma tu MERP: activa las plantillas y aplicaciones que quieres usar.
        </p>
      </div>

      {error && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No se pudieron cargar tus módulos. Por ahora se muestran todos; intenta de nuevo más tarde.
        </div>
      )}
      {fallo && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fallo}</div>
      )}

      <Grupo
        titulo="Plantillas de pendientes"
        descripcion="Cada plantilla trae sus propias subcategorías. Sus pendientes siempre aparecen en Inicio; desactivarla solo oculta su sección."
        modulos={catalogo.filter((m) => m.clase === "plantilla_pendientes")}
      >
        {tarjeta}
      </Grupo>

      <Grupo
        titulo="Aplicaciones"
        descripcion="Herramientas independientes dentro de MERP."
        modulos={catalogo.filter((m) => m.clase === "aplicacion")}
      >
        {tarjeta}
      </Grupo>

      <div className="border border-dashed border-gray-200 rounded-xl px-4 py-5 text-center">
        <p className="text-sm font-medium text-gray-500">Más módulos próximamente</p>
        <p className="text-xs text-gray-400 mt-0.5">Finanzas, Notas y otras aplicaciones se agregarán aquí.</p>
      </div>
    </div>
  );
}
