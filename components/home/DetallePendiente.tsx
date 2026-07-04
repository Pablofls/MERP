"use client";
import { useState } from "react";
import type { Pendiente, Materia } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { formatFechaCorta, esFechaVencida, cn } from "@/lib/utils";

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

  if (!pendiente) return null;

  const mat = materias.find((m) => m.id === pendiente.materiaId);
  const vencido = !pendiente.completado && pendiente.fechaLimite && esFechaVencida(pendiente.fechaLimite);

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
