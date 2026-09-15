"use client";
import { useState } from "react";
import type { Pendiente, Materia, CategoriaPersonal } from "@/lib/types";
import { etiquetaFecha } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import FormPendiente from "./FormPendiente";
import DetallePendiente from "./DetallePendiente";
import TimelinePendientes, { type GrupoTimeline } from "./TimelinePendientes";
import EmptyState from "@/components/ui/EmptyState";
import FiltroChips, { type OpcionFiltro } from "@/components/ui/FiltroChips";
import { useOrdenFecha, type OrdenFecha } from "@/lib/hooks/useOrdenFecha";

interface Props {
  pendientes: Pendiente[];
  materias: Materia[];
  categorias: CategoriaPersonal[];
  onToggle: (id: string) => void;
  onAgregar: (datos: Omit<Pendiente, "id" | "completado">) => void;
  onEditar: (id: string, datos: Partial<Pick<Pendiente, "titulo" | "descripcion" | "fechaLimite" | "materiaId">>) => void;
  onEliminar: (id: string) => void;
}

function agruparPorDia(items: Pendiente[], orden: OrdenFecha = "desc"): GrupoTimeline[] {
  const conFecha = [...items.filter((p) => p.fechaLimite)].sort((a, b) =>
    orden === "desc"
      ? (a.fechaLimite! > b.fechaLimite! ? -1 : 1)
      : (a.fechaLimite! < b.fechaLimite! ? -1 : 1)
  );
  const sinFecha = items.filter((p) => !p.fechaLimite);

  const mapa = new Map<string, Pendiente[]>();
  for (const p of conFecha) {
    const key = p.fechaLimite!;
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key)!.push(p);
  }

  const grupos: GrupoTimeline[] = Array.from(mapa.entries()).map(([fecha, items]) => ({
    label: etiquetaFecha(fecha),
    fecha,
    items,
  }));
  if (sinFecha.length > 0) grupos.unshift({ label: "Sin fecha", fecha: null, items: sinFecha });
  return grupos;
}

export default function PendientesHoy({ pendientes, materias, categorias, onToggle, onAgregar, onEditar, onEliminar }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [detalle, setDetalle] = useState<Pendiente | null>(null);
  const [orden, toggleOrden] = useOrdenFecha("inicio");
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroSub, setFiltroSub] = useState<string | null>(null);

  function handleFiltroTipo(id: string | null) {
    setFiltroTipo(id);
    setFiltroSub(null);
  }

  const incompletos = pendientes.filter((p) => !p.completado);
  const countEscolar = incompletos.filter((p) => p.tipo === "escolar").length;
  const countPersonal = incompletos.filter((p) => p.tipo === "personal").length;

  const tiposSinTodo: OpcionFiltro[] = [
    { id: "escolar", label: "Escolar", count: countEscolar },
    { id: "personal", label: "Personal", count: countPersonal },
  ].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  const opcionesTipo: OpcionFiltro[] = [{ id: null, label: "Todo" }, ...tiposSinTodo];

  const opcionesSub: OpcionFiltro[] =
    filtroTipo === "escolar"
      ? (() => {
          const opts = materias.map((m) => ({
            id: m.id,
            label: m.nombre,
            color: m.color,
            count: incompletos.filter((p) => p.tipo === "escolar" && p.materiaId === m.id).length,
          }));
          opts.sort((a, b) => b.count - a.count);
          return opts;
        })()
      : filtroTipo === "personal"
      ? (() => {
          const opts = categorias.map((c) => ({
            id: c.id,
            label: c.nombre,
            color: c.color,
            count: incompletos.filter((p) => p.tipo === "personal" && p.categoriaPersonalId === c.id).length,
          }));
          opts.sort((a, b) => b.count - a.count);
          return opts;
        })()
      : [];

  const pendientesFiltrados = pendientes.filter((p) => {
    if (mostrarCompletados ? false : p.completado) return false;
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    if (filtroSub) {
      if (p.tipo === "escolar" && p.materiaId !== filtroSub) return false;
      if (p.tipo === "personal" && p.categoriaPersonalId !== filtroSub) return false;
    }
    return true;
  });

  const grupos = agruparPorDia(pendientesFiltrados, orden);

  return (
    <section data-tutorial-id="pendientes-section">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pendientes</h2>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setMostrarCompletados(!mostrarCompletados)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {mostrarCompletados ? "Ocultar completados" : "Ver todos"}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            data-tutorial-id="btn-agregar-pendiente"
            className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-1.5 mb-3">
        <FiltroChips opciones={opcionesTipo} valor={filtroTipo} onChange={handleFiltroTipo} />
        {opcionesSub.length > 0 && (
          <FiltroChips opciones={[{ id: null, label: "Todo" }, ...opcionesSub]} valor={filtroSub} onChange={setFiltroSub} />
        )}
      </div>

      {pendientesFiltrados.length === 0 ? (
        <EmptyState title="Sin pendientes" description="Todo al dia" />
      ) : (
        <TimelinePendientes
          grupos={grupos}
          materias={materias}
          categorias={categorias}
          onToggle={onToggle}
          onSeleccionar={setDetalle}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo pendiente">
        <FormPendiente
          materias={materias}
          categorias={categorias}
          onSubmit={(datos) => {
            onAgregar(datos);
            setModalOpen(false);
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <DetallePendiente
        pendiente={detalle}
        materias={materias}
        categorias={categorias}
        onClose={() => setDetalle(null)}
        onToggle={(id) => { onToggle(id); setDetalle(null); }}
        onEditar={onEditar}
        onEliminar={onEliminar}
      />
    </section>
  );
}
