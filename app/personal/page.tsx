"use client";
import { useState } from "react";
import { usePendientes } from "@/lib/hooks/usePendientes";
import type { Pendiente } from "@/lib/types";
import { formatFechaCorta, esFechaVencida, etiquetaFecha, cn, fechaHoy } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import DetallePendiente from "@/components/home/DetallePendiente";
import PendienteItem from "@/components/home/PendienteItem";

// Semana actual: muestra 7 días desde lunes
function getSemanaActual(): Date[] {
  const hoy = new Date();
  const lunes = new Date(hoy);
  const dow = (hoy.getDay() + 6) % 7; // lunes = 0
  lunes.setDate(hoy.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

function CalendarioSemana({ pendientes }: { pendientes: Pendiente[] }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const hoy = fechaHoy();
  const semana = getSemanaActual();

  function isoFecha(d: Date) {
    return d.toISOString().split("T")[0];
  }

  function pendientesDelDia(fecha: string) {
    return pendientes.filter((p) => p.fechaLimite === fecha && !p.completado);
  }

  const pendientesDia = diaSeleccionado ? pendientesDelDia(diaSeleccionado) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Tira de días */}
      <div className="grid grid-cols-7 divide-x divide-gray-100">
        {semana.map((dia, i) => {
          const iso = isoFecha(dia);
          const esHoy = iso === hoy;
          const tiene = pendientesDelDia(iso).length > 0;
          const activo = diaSeleccionado === iso;
          return (
            <button
              key={iso}
              onClick={() => setDiaSeleccionado(activo ? null : iso)}
              className={cn(
                "flex flex-col items-center py-3 transition-colors",
                activo ? "bg-blue-900 text-white" : esHoy ? "bg-blue-50" : "hover:bg-gray-50"
              )}
            >
              <span className={cn("text-[10px] font-semibold uppercase tracking-wider", activo ? "text-slate-400" : "text-gray-400")}>
                {DIAS_CORTOS[i]}
              </span>
              <span className={cn("text-sm font-semibold mt-1", activo ? "text-white" : esHoy ? "text-blue-900" : "text-gray-700")}>
                {dia.getDate()}
              </span>
              {tiene && (
                <span className={cn("w-1 h-1 rounded-full mt-1", activo ? "bg-white" : "bg-blue-400")} />
              )}
            </button>
          );
        })}
      </div>

      {/* Pendientes del dia seleccionado */}
      {diaSeleccionado && (
        <div className="border-t border-gray-100 px-4 py-3">
          {pendientesDia.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">Sin pendientes este dia</p>
          ) : (
            <ul className="space-y-1.5">
              {pendientesDia.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{p.titulo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function FormPendientePersonal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (datos: Omit<Pendiente, "id" | "completado">) => void;
  onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSubmit({ titulo: titulo.trim(), descripcion: descripcion.trim() || undefined, fechaLimite: fechaLimite || undefined, tipo: "personal" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Titulo</label>
        <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Que tienes pendiente?" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800" autoFocus />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripcion</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalles opcionales" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha limite</label>
        <input type="date" value={fechaLimite} min={fechaHoy()} onChange={(e) => setFechaLimite(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
        <button type="submit" disabled={!titulo.trim()} className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-40 transition-colors">Agregar</button>
      </div>
    </form>
  );
}

function agruparPorDia(items: Pendiente[]) {
  const conFecha = [...items.filter((p) => p.fechaLimite)].sort((a, b) =>
    a.fechaLimite! < b.fechaLimite! ? -1 : 1
  );
  const sinFecha = items.filter((p) => !p.fechaLimite);
  const mapa = new Map<string, Pendiente[]>();
  for (const p of conFecha) {
    if (!mapa.has(p.fechaLimite!)) mapa.set(p.fechaLimite!, []);
    mapa.get(p.fechaLimite!)!.push(p);
  }
  const grupos: { label: string; items: Pendiente[] }[] = Array.from(mapa.entries()).map(
    ([fecha, items]) => ({ label: etiquetaFecha(fecha), items })
  );
  if (sinFecha.length > 0) grupos.push({ label: "Sin fecha", items: sinFecha });
  return grupos;
}

export default function PersonalPage() {
  const { pendientes, agregar, toggleCompletado, eliminar, editar } = usePendientes();
  const [modalOpen, setModalOpen] = useState(false);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [detalle, setDetalle] = useState<Pendiente | null>(null);

  const pendientesPersonales = pendientes.filter((p) => p.tipo === "personal");
  const pendientesFiltrados = pendientesPersonales.filter((p) => mostrarCompletados || !p.completado);
  const grupos = agruparPorDia(pendientesFiltrados);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personal</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {pendientesPersonales.filter((p) => !p.completado).length} pendientes
          </p>
        </div>
      </div>

      {/* Calendario semanal */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Esta semana</h2>
        <CalendarioSemana pendientes={pendientesPersonales} />
      </section>

      {/* Lista de pendientes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendientes</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => setMostrarCompletados(!mostrarCompletados)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {mostrarCompletados ? "Ocultar completados" : "Ver todos"}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-900 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar
            </button>
          </div>
        </div>

        {pendientesFiltrados.length === 0 ? (
          <EmptyState title="Sin pendientes personales" />
        ) : (
          <div className="space-y-4">
            {grupos.map((grupo) => (
              <div key={grupo.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{grupo.label}</p>
                <ul className="divide-y divide-gray-100">
                  {grupo.items.map((p) => {
                    const vencido = !p.completado && p.fechaLimite && esFechaVencida(p.fechaLimite);
                    return (
                      <PendienteItem
                        key={p.id}
                        pendiente={p}
                        onToggle={toggleCompletado}
                        onClick={() => setDetalle(p)}
                      >
                        {p.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.descripcion}</p>}
                        {p.fechaLimite && (
                          <span className={cn("text-xs mt-0.5 inline-block", vencido ? "text-red-600 font-medium" : "text-gray-400")}>
                            {vencido ? "Vencido · " : ""}{formatFechaCorta(p.fechaLimite)}
                          </span>
                        )}
                      </PendienteItem>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo pendiente personal">
        <FormPendientePersonal
          onSubmit={(datos) => { agregar(datos); setModalOpen(false); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <DetallePendiente
        pendiente={detalle}
        materias={[]}
        onClose={() => setDetalle(null)}
        onToggle={(id) => { toggleCompletado(id); setDetalle(null); }}
        onEditar={editar}
        onEliminar={eliminar}
      />
    </div>
  );
}
