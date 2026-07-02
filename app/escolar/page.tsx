"use client";
import { useState } from "react";
import { usePendientes } from "@/lib/hooks/usePendientes";
import { useMaterias } from "@/lib/hooks/useMaterias";
import { useClases } from "@/lib/hooks/useClases";
import HorarioSemanal from "@/components/escolar/HorarioSemanal";
import GestorMaterias from "@/components/escolar/GestorMaterias";
import GestorClases from "@/components/escolar/GestorClases";
import PendientesHoy from "@/components/home/PendientesHoy";

type Tab = "horario" | "pendientes" | "configurar";

export default function EscolarPage() {
  const [tab, setTab] = useState<Tab>("horario");
  const { pendientes, agregar, toggleCompletado } = usePendientes();
  const { materias, agregar: agregarMat, editar: editarMat, eliminar: eliminarMat } = useMaterias();
  const { clases, agregar: agregarClase, eliminar: eliminarClase } = useClases();

  const pendientesEscolares = pendientes.filter((p) => p.tipo === "escolar");

  const TABS: { id: Tab; label: string }[] = [
    { id: "horario",    label: "Horario" },
    { id: "pendientes", label: "Pendientes" },
    { id: "configurar", label: "Configurar" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Escolar</h1>
      <p className="text-sm text-gray-400 mb-5">{materias.length} materias · {clases.length} clases</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "horario" && (
        <HorarioSemanal clases={clases} materias={materias} />
      )}

      {tab === "pendientes" && (
        <PendientesHoy
          pendientes={pendientesEscolares}
          materias={materias}
          onToggle={toggleCompletado}
          onAgregar={(datos) => agregar({ ...datos, tipo: "escolar" })}
        />
      )}

      {tab === "configurar" && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <GestorMaterias
              materias={materias}
              onAgregar={agregarMat}
              onEditar={editarMat}
              onEliminar={eliminarMat}
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <GestorClases
              clases={clases}
              materias={materias}
              onAgregar={agregarClase}
              onEliminar={eliminarClase}
            />
          </div>
        </div>
      )}
    </div>
  );
}
