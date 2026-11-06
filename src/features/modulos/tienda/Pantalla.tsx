// Piezas para armar las pantallas de vista previa con el mismo encabezado y títulos que las páginas reales.

export function Encabezado({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
      <p className="text-xs text-gray-400 mt-0.5">{detalle}</p>
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

/** Callback vacío para las acciones de los componentes reales (la vista previa no guarda nada). */
export const nada = () => {};
