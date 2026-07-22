"use client";
import { useState, useRef, useEffect } from "react";
import type { Pendiente, Materia } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { formatFechaCorta, esFechaVencida, cn } from "@/lib/utils";
import { useSubtareas } from "@/lib/hooks/useSubtareas";

interface Props {
  pendiente: Pendiente | null;
  materias: Materia[];
  onClose: () => void;
  onToggle: (id: string) => void;
  onEditar: (id: string, datos: Partial<Pick<Pendiente, "titulo" | "descripcion" | "fechaLimite" | "materiaId">>) => void;
  onEliminar: (id: string) => void;
}

export default function DetallePendiente({ pendiente, materias, onClose, onToggle, onEditar, onEliminar }: Props) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [nuevaSubtarea, setNuevaSubtarea] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { subtareas, agregar, toggleCompletar, eliminar: eliminarSub } = useSubtareas(pendiente?.id ?? null);

  // Reset editing state when pendiente changes
  useEffect(() => {
    setEditando(false);
    setNuevaSubtarea("");
  }, [pendiente?.id]);

  function abrirEdicion() {
    if (!pendiente) return;
    setTitulo(pendiente.titulo);
    setDescripcion(pendiente.descripcion ?? "");
    setFechaLimite(pendiente.fechaLimite ?? "");
    setMateriaId(pendiente.materiaId ?? materias[0]?.id ?? "");
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
  }

  function guardar() {
    if (!pendiente || !titulo.trim()) return;
    onEditar(pendiente.id, {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fechaLimite: fechaLimite || undefined,
      materiaId: pendiente.tipo === "escolar" ? materiaId : undefined,
    });
    setEditando(false);
    onClose();
  }

  function confirmarEliminar() {
    if (!pendiente) return;
    onEliminar(pendiente.id);
    onClose();
  }

  async function handleAgregarSubtarea(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaSubtarea.trim()) return;
    await agregar(nuevaSubtarea);
    setNuevaSubtarea("");
    inputRef.current?.focus();
  }

  if (!pendiente) return null;

  const mat = materias.find((m) => m.id === pendiente.materiaId);
  const vencido = !pendiente.completado && pendiente.fechaLimite && esFechaVencida(pendiente.fechaLimite);
  const totalSub = subtareas.length;
  const completadasSub = subtareas.filter((s) => s.completado).length;

  return (
    <Modal
      open={!!pendiente}
      onClose={() => { setEditando(false); onClose(); }}
      title={editando ? "Editar pendiente" : "Pendiente"}
    >
      {!editando ? (
        <div className="space-y-4">
          <div>
            <p className={cn("text-base font-medium", pendiente.completado ? "line-through text-gray-400" : "text-gray-900")}>
              {pendiente.titulo}
            </p>
          </div>

          {pendiente.descripcion && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Descripción</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{pendiente.descripcion}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {pendiente.tipo === "escolar" ? (
              <Badge color={mat?.color ?? "#1e4976"}>{mat?.nombre ?? "Escolar"}</Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-500 border border-gray-200">Personal</Badge>
            )}
            {pendiente.fechaLimite && (
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", vencido ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500")}>
                {vencido ? "Vencido · " : ""}{formatFechaCorta(pendiente.fechaLimite)}
              </span>
            )}
          </div>

          {/* Subtareas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Subtareas{totalSub > 0 ? ` · ${completadasSub}/${totalSub}` : ""}
              </p>
            </div>

            {subtareas.length > 0 && (
              <ul className="space-y-1 mb-2">
                {subtareas.map((sub) => (
                  <li key={sub.id} className="flex items-center gap-2 group py-1">
                    <button
                      type="button"
                      onClick={() => toggleCompletar(sub.id)}
                      className={cn(
                        "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                        sub.completado
                          ? "bg-blue-900 border-blue-900"
                          : "border-gray-300 hover:border-blue-900"
                      )}
                    >
                      {sub.completado && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm transition-all duration-300",
                        sub.completado ? "line-through text-gray-400" : "text-gray-700"
                      )}
                    >
                      {sub.titulo}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarSub(sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Input nueva subtarea */}
            <form onSubmit={handleAgregarSubtarea} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={nuevaSubtarea}
                onChange={(e) => setNuevaSubtarea(e.target.value)}
                placeholder="Agregar subtarea…"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900 placeholder:text-gray-300"
              />
              <button
                type="submit"
                disabled={!nuevaSubtarea.trim()}
                className="p-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-30 transition-colors flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </form>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={confirmarEliminar}
              className="px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              Eliminar
            </button>
            <div className="flex-1" />
            <button
              onClick={abrirEdicion}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onToggle(pendiente.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pendiente.completado
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-blue-900 text-white hover:bg-blue-800"
              )}
            >
              {pendiente.completado ? "Reabrir" : "Completar"}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); guardar(); }}
          className="space-y-4"
        >
          {pendiente.tipo === "escolar" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Materia</label>
              <select
                value={materiaId}
                onChange={(e) => setMateriaId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
              >
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha límite</label>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={cancelarEdicion}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!titulo.trim()}
              className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-40 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
