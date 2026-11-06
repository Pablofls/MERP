"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { usePendientes } from "@/features/home/hooks/usePendientes";
import { useCategorias } from "@/features/personal/hooks/useCategorias";
import type { Pendiente } from "@/lib/types";
import { useOrdenFecha } from "@/features/home/hooks/useOrdenFecha";
import { useVistaPendientes } from "@/features/home/hooks/useVistaPendientes";
import { agruparPorDia } from "@/features/home/lib/agrupar";
import Modal from "@/components/ui/Modal";
import { SkeletonLista } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import FiltroChips from "@/components/ui/FiltroChips";
const DetallePendiente = dynamic(() => import("@/features/home/components/DetallePendiente"), { ssr: false });
import TimelinePendientes from "@/features/home/components/TimelinePendientes";
import ListaPendientes from "@/features/home/components/ListaPendientes";
import BotonVista from "@/components/ui/BotonVista";
import FormPendiente from "@/features/home/components/FormPendiente";
import GestorCategorias from "@/features/personal/components/GestorCategorias";
import CalendarioSemana from "@/features/personal/components/CalendarioSemana";
import { useHotkey } from "@/lib/hooks/useHotkey";

export default function PersonalPage() {
  const { cargando, pendientes, agregar, toggleCompletado, eliminar, editar } = usePendientes();
  const { categorias, agregar: agregarCat, eliminar: eliminarCat } = useCategorias();
  const [modalOpen, setModalOpen] = useState(false);
  const [configAbierto, setConfigAbierto] = useState(false);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [detalle, setDetalle] = useState<Pendiente | null>(null);
  const [orden, toggleOrden] = useOrdenFecha("personal");
  const [vista, toggleVista] = useVistaPendientes("personal");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const agregarHotkeyRef = useHotkey<HTMLButtonElement>("Agregar");

  const pendientesPersonales = pendientes.filter((p) => p.tipo === "personal");
  const pendientesFiltrados = pendientesPersonales.filter(
    (p) => (mostrarCompletados || !p.completado) && (!filtroCategoria || p.categoriaPersonalId === filtroCategoria)
  );
  // La linea de tiempo siempre corre de pasado a futuro; el orden solo aplica a la lista
  const grupos = agruparPorDia(pendientesFiltrados, vista === "timeline" ? "asc" : orden);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personal</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {pendientesPersonales.filter((p) => !p.completado).length} pendientes · {categorias.length} categorías
          </p>
        </div>
        <button
          onClick={() => setConfigAbierto(!configAbierto)}
          data-tutorial-id="btn-config-personal"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Configurar
        </button>
      </div>

      {configAbierto && (
        <div className="border border-gray-200 rounded-xl bg-white p-4">
          <GestorCategorias categorias={categorias} onAgregar={agregarCat} onEliminar={eliminarCat} />
        </div>
      )}

      {/* Calendario semanal */}
      <section data-tutorial-id="calendario-personal-section">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Esta semana</h2>
        <CalendarioSemana pendientes={pendientesPersonales} />
      </section>

      {/* Lista de pendientes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendientes</h2>
            <BotonVista vista={vista} onToggle={toggleVista} />
          </div>
          <div className="flex items-center gap-3">
            {vista === "lista" && (
            <button
              onClick={toggleOrden}
              title={orden === "desc" ? "Mayor a menor" : "Menor a mayor"}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {orden === "desc" ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 15m0 0l3.75-3.75M17.25 15V5.25" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21l3.75-3.75" />
                </svg>
              )}
            </button>
            )}
            <button onClick={() => setMostrarCompletados(!mostrarCompletados)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {mostrarCompletados ? "Ocultar completados" : "Ver todos"}
            </button>
            <button
              ref={agregarHotkeyRef}
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar
            </button>
          </div>
        </div>

        {/* Filtro por categoría */}
        {categorias.length > 1 && (
          <div className="mb-3">
            <FiltroChips
              opciones={[
                { id: null, label: "Todo" },
                ...[...categorias]
                  .map((c) => ({
                    id: c.id,
                    label: c.nombre,
                    color: c.color,
                    count: pendientesPersonales.filter((p) => !p.completado && p.categoriaPersonalId === c.id).length,
                  }))
                  .sort((a, b) => b.count - a.count),
              ]}
              valor={filtroCategoria}
              onChange={setFiltroCategoria}
            />
          </div>
        )}

        {cargando ? (
          <SkeletonLista />
        ) : pendientesFiltrados.length === 0 ? (
          <EmptyState title="Sin pendientes personales" />
        ) : (
          vista === "timeline" ? (
            <TimelinePendientes
              grupos={grupos}
              materias={[]}
              categorias={categorias}
              onToggle={toggleCompletado}
              onSeleccionar={setDetalle}
            />
          ) : (
            <ListaPendientes
              grupos={grupos}
              materias={[]}
              categorias={categorias}
              onToggle={toggleCompletado}
              onSeleccionar={setDetalle}
            />
          )
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo pendiente personal">
        <FormPendiente
          materias={[]}
          categorias={categorias}
          tipoPredeterminado="personal"
          onSubmit={(datos, subtareas) => { agregar(datos, subtareas); setModalOpen(false); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <DetallePendiente
        pendiente={detalle}
        materias={[]}
        categorias={categorias}
        onClose={() => setDetalle(null)}
        onToggle={(id) => { toggleCompletado(id); setDetalle(null); }}
        onEditar={editar}
        onEliminar={eliminar}
      />
    </div>
  );
}
