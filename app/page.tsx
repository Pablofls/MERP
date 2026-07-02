"use client";
import { usePendientes } from "@/lib/hooks/usePendientes";
import { useMaterias } from "@/lib/hooks/useMaterias";
import { useClases } from "@/lib/hooks/useClases";
import AgendaHoy from "@/components/home/AgendaHoy";
import PendientesHoy from "@/components/home/PendientesHoy";

export default function HomePage() {
  const { pendientes, agregar, toggleCompletado } = usePendientes();
  const { materias } = useMaterias();
  const { clases } = useClases();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">MERP</h1>
      <div className="space-y-6">
        <AgendaHoy clases={clases} materias={materias} />
        <div className="border-t border-gray-100" />
        <PendientesHoy
          pendientes={pendientes}
          materias={materias}
          onToggle={toggleCompletado}
          onAgregar={agregar}
        />
      </div>
    </div>
  );
}
