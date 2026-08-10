"use client";
import { usePendientes } from "@/lib/hooks/usePendientes";
import { useMaterias } from "@/lib/hooks/useMaterias";
import { useClases } from "@/lib/hooks/useClases";
import { useCategorias } from "@/lib/hooks/useCategorias";
import { useFechasImportantes } from "@/lib/hooks/useFechasImportantes";
import AgendaHoy from "@/components/home/AgendaHoy";
import PendientesHoy from "@/components/home/PendientesHoy";
import { estaEnSieteDias, fechaImportanteAPendiente } from "@/lib/utils";

export default function HomePage() {
  const { pendientes, agregar, toggleCompletado, eliminar, editar } = usePendientes();
  const { materias } = useMaterias();
  const { clases } = useClases();
  const { categorias } = useCategorias();
  const { fechas, toggleCompletado: toggleFecha } = useFechasImportantes();

  // Fechas importantes dentro de 7 días se muestran como pendientes
  const fechasProximas = fechas
    .filter((f) => !f.completado && estaEnSieteDias(f.fecha))
    .map(fechaImportanteAPendiente);

  const todosPendientes = [...pendientes, ...fechasProximas];

  function handleToggle(id: string) {
    if (fechas.some((f) => f.id === id)) {
      toggleFecha(id);
    } else {
      toggleCompletado(id);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">MERP</h1>
      <div className="space-y-6">
        <AgendaHoy clases={clases} materias={materias} />
        <div className="border-t border-gray-100" />
        <PendientesHoy
          pendientes={todosPendientes}
          materias={materias}
          categorias={categorias}
          onToggle={handleToggle}
          onAgregar={agregar}
          onEditar={editar}
          onEliminar={eliminar}
        />
      </div>
    </div>
  );
}
