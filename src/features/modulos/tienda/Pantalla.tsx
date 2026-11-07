// Piezas para armar las pantallas de vista previa con el mismo encabezado y títulos que las páginas reales.

const ICONO_CONFIG =
  "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z";

function BotonAgregar({ texto }: { texto: string }) {
  return (
    <span className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      {texto}
    </span>
  );
}

export function Encabezado({ titulo, detalle, accion }: { titulo: string; detalle: string; accion?: "configurar" | "nuevo" | "agregar" }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{detalle}</p>
      </div>
      {accion === "configurar" && (
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ICONO_CONFIG} />
          </svg>
          Configurar
        </span>
      )}
      {accion === "nuevo" && <BotonAgregar texto="Nuevo" />}
      {accion === "agregar" && <BotonAgregar texto="Agregar" />}
    </div>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

/** Sección de pendientes con la misma barra que las páginas (Ver todos · Agregar). */
export function SeccionPendientes({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendientes</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Ver todos</span>
          <BotonAgregar texto="Agregar" />
        </div>
      </div>
      {children}
    </section>
  );
}

/** Callback vacío para las acciones de los componentes reales (la vista previa no guarda nada). */
export const nada = () => {};
