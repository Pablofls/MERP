"use client";
import { useState } from "react";
import { usePendientes } from "@/lib/hooks/usePendientes";
import { useCategorias } from "@/lib/hooks/useCategorias";
import type { Pendiente } from "@/lib/types";
import { useOrdenFecha, type OrdenFecha } from "@/lib/hooks/useOrdenFecha";
import { formatFechaCorta, esFechaVencida, etiquetaFecha, cn, fechaHoy } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import FiltroChips from "@/components/ui/FiltroChips";
import DetallePendiente from "@/components/home/DetallePendiente";
import PendienteItem from "@/components/home/PendienteItem";
import FormPendiente from "@/components/home/FormPendiente";
import GestorCategorias from "@/components/personal/GestorCategorias";

function getSemanaConOffset(offset: number): Date[] {
  const hoy = new Date();
  const lunes = new Date(hoy);
  const dow = (hoy.getDay() + 6) % 7;
  lunes.setDate(hoy.getDate() - dow + offset * 7);
  lunes.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

function semanaLabel(semana: Date[]): string {
  const ini = semana[0].toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const fin = semana[6].toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  return `${ini} – ${fin}`;
}

const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

function CalendarioSemana({ pendientes }: { pendientes: Pendiente[] }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const hoy = fechaHoy();
  const semana = getSemanaConOffset(semanaOffset);

  function isoFecha(d: Date) {
    return d.toISOString().split("T")[0];
  }

  function pendientesDelDia(fecha: string) {
    return pendientes.filter((p) => p.fechaLimite === fecha && !p.completado);
  }

  const pendientesDia = diaSeleccionado ? pendientesDelDia(diaSeleccionado) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Navegación de semana */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <button
          onClick={() => { setSemanaOffset((o) => o - 1); setDiaSeleccionado(null); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-xs font-semibold text-gray-700 capitalize">{semanaLabel(semana)}</span>
        <button
          onClick={() => { setSemanaOffset((o) => o + 1); setDiaSeleccionado(null); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

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
                activo ? "bg-blue-900 text-white" : "hover:bg-gray-50"
              )}
            >
              <span className={cn("text-[10px] font-semibold uppercase tracking-wider", activo ? "text-slate-400" : "text-gray-400")}>
                {DIAS_CORTOS[i]}
              </span>
              <span className={cn(
                "text-sm font-semibold mt-1 w-6 h-6 flex items-center justify-center rounded-full",
                activo ? "text-white" : esHoy ? "bg-blue-900 text-white" : "text-gray-700"
              )}>
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


function agruparPorDia(items: Pendiente[], orden: OrdenFecha = "desc") {
  const conFecha = [...items.filter((p) => p.fechaLimite)].sort((a, b) =>
    orden === "desc"
      ? (a.fechaLimite! > b.fechaLimite! ? -1 : 1)
      : (a.fechaLimite! < b.fechaLimite! ? -1 : 1)
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
  const { categorias, agregar: agregarCat, eliminar: eliminarCat } = useCategorias();
  const [modalOpen, setModalOpen] = useState(false);
  const [configAbierto, setConfigAbierto] = useState(false);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [detalle, setDetalle] = useState<Pendiente | null>(null);
  const [orden, toggleOrden] = useOrdenFecha("personal");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);

  const pendientesPersonales = pendientes.filter((p) => p.tipo === "personal");
  const pendientesFiltrados = pendientesPersonales.filter(
    (p) => (mostrarCompletados || !p.completado) && (!filtroCategoria || p.categoriaPersonalId === filtroCategoria)
  );
  const grupos = agruparPorDia(pendientesFiltrados, orden);
  const getCat = (id?: string) => categorias.find((c) => c.id === id);

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
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendientes</h2>
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
            <button onClick={() => setMostrarCompletados(!mostrarCompletados)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {mostrarCompletados ? "Ocultar completados" : "Ver todos"}
            </button>
            <button
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

        {pendientesFiltrados.length === 0 ? (
          <EmptyState title="Sin pendientes personales" />
        ) : (
          <div className="space-y-4">
            {grupos.map((grupo) => (
              <div key={grupo.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{grupo.label}</p>
                <ul className="divide-y divide-gray-100">
                  {grupo.items.map((p) => {
                    const cat = getCat(p.categoriaPersonalId);
                    const vencido = !p.completado && p.fechaLimite && esFechaVencida(p.fechaLimite);
                    return (
                      <PendienteItem
                        key={p.id}
                        pendiente={p}
                        onToggle={toggleCompletado}
                        onClick={() => setDetalle(p)}
                      >
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge color={cat?.color ?? "#4a3a6b"}>{cat?.nombre ?? "Personal"}</Badge>
                          {p.descripcion && <span className="text-xs text-gray-400 truncate max-w-[200px]">{p.descripcion}</span>}
                          {p.fechaLimite && (
                            <span className={cn("text-xs", vencido ? "text-red-600 font-medium" : "text-gray-400")}>
                              {vencido ? "Vencido · " : ""}{formatFechaCorta(p.fechaLimite)}
                            </span>
                          )}
                        </div>
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
        <FormPendiente
          materias={[]}
          categorias={categorias}
          tipoPredeterminado="personal"
          onSubmit={(datos) => { agregar(datos); setModalOpen(false); }}
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
