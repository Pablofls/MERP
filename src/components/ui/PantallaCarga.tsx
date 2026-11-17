/**
 * Pantalla de carga de la app: mismo diseño que las imágenes de arranque de iOS (public/splash) para que el paso
 * del splash a la app no se note, más un indicador de actividad.
 */
export default function PantallaCarga() {
  return (
    <div role="status" aria-live="polite" className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50">
      <div className="w-24 h-24 rounded-[20px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.10)] flex items-center justify-center">
        <span className="text-5xl font-bold text-slate-900 leading-none">M</span>
      </div>
      <p className="mt-5 text-[22px] font-bold tracking-wide text-slate-900">MERP</p>
      <span className="mt-6 w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-700 animate-spin" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
