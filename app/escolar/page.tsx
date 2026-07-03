"use client";
import { useState } from "react";
import { usePendientes } from "@/lib/hooks/usePendientes";
import { useMaterias } from "@/lib/hooks/useMaterias";
import { useClases } from "@/lib/hooks/useClases";
import { useGoogleCalendarSemana } from "@/lib/hooks/useGoogleCalendarSemana";
import HorarioSemanal from "@/components/escolar/HorarioSemanal";
import GestorMaterias from "@/components/escolar/GestorMaterias";
import GestorClases from "@/components/escolar/GestorClases";
import { formatFechaCorta, esFechaVencida, etiquetaFecha, cn } from "@/lib/utils";
import DetallePendiente from "@/components/home/DetallePendiente";
import PendienteItem from "@/components/home/PendienteItem";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import FormPendiente from "@/components/home/FormPendiente";
import EmptyState from "@/components/ui/EmptyState";
import type { Pendiente } from "@/lib/types";

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
    ([fecha, grp]) => ({ label: etiquetaFecha(fecha), items: grp })
  );
  if (sinFecha.length > 0) grupos.push({ label: "Sin fecha", items: sinFecha });
  return grupos;
}

export default function EscolarPage() {
  const { pendientes, agregar, toggleCompletado, eliminar, editar } = usePendientes();
  const { materias, agregar: agregarMat, editar: editarMat, eliminar: eliminarMat } = useMaterias();
  const { clases, agregar: agregarClase, eliminar: eliminarClase } = useClases();
  const { eventos: googleEventos } = useGoogleCalendarSemana();
  const [modalPendiente, setModalPendiente] = useState(false);
  const [configAbierto, setConfigAbierto] = useState(false);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [detalle, setDetalle] = useState<Pendiente | null>(null);

  const pendientesEscolares = pendientes.filter(
    (p) => p.tipo === "escolar" && (mostrarCompletados || !p.completado)
  );
  const grupos = agruparPorDia(pendientesEscolares);
  const getMat = (id?: string) => materias.find((m) => m.id === id);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Escolar</h1>
          <p className="text-xs text-gray-400 mt-0.5">{materias.length} materias · {clases.length} clases</p>
        </div>
        <button
          onClick={() => setConfigAbierto(!configAbierto)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Configurar
        </button>
      </div>

      {/* Panel de configuracion colapsable */}
      {configAbierto && (
        <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
          <div className="p-4">
            <GestorMaterias materias={materias} onAgregar={agregarMat} onEditar={editarMat} onEliminar={eliminarMat} />
          </div>
          <div className="p-4">
            <GestorClases clases={clases} materias={materias} onAgregar={agregarClase} onEliminar={eliminarClase} />
          </div>
        </div>
      )}

      {/* Horario semanal */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Horario semanal</h2>
        <HorarioSemanal clases={clases} materias={materias} googleEventos={googleEventos} />
      </section>

      {/* Pendientes escolares */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendientes</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMostrarCompletados(!mostrarCompletados)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {mostrarCompletados ? "Ocultar completados" : "Ver todos"}
            </button>
            <button
              onClick={() => setModalPendiente(true)}
              className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-900 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar
            </button>
          </div>
        </div>

        {pendientesEscolares.length === 0 ? (
          <EmptyState title="Sin pendientes escolares" />
        ) : (
          <div className="space-y-4">
            {grupos.map((grupo) => (
              <div key={grupo.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{grupo.label}</p>
                <ul className="divide-y divide-gray-100">
                  {grupo.items.map((p) => {
                    const mat = getMat(p.materiaId);
                    const vencido = !p.completado && p.fechaLimite && esFechaVencida(p.fechaLimite);
                    return (
                      <PendienteItem
                        key={p.id}
                        pendiente={p}
                        onToggle={toggleCompletado}
                        onClick={() => setDetalle(p)}
                      >
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge color={mat?.color ?? "#1e4976"}>{mat?.nombre ?? "Escolar"}</Badge>
                          {p.descripcion && (
                            <span className="text-xs text-gray-400 truncate max-w-[200px]">{p.descripcion}</span>
                          )}
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

      <Modal open={modalPendiente} onClose={() => setModalPendiente(false)} title="Nuevo pendiente escolar">
        <FormPendiente
          materias={materias}
          tipoPredeterminado="escolar"
          onSubmit={(datos) => { agregar({ ...datos, tipo: "escolar" }); setModalPendiente(false); }}
          onCancel={() => setModalPendiente(false)}
        />
      </Modal>

      <DetallePendiente
        pendiente={detalle}
        materias={materias}
        onClose={() => setDetalle(null)}
        onToggle={(id) => { toggleCompletado(id); setDetalle(null); }}
        onEditar={editar}
        onEliminar={eliminar}
      />
    </div>
  );
}
