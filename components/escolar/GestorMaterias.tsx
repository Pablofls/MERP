"use client";
import { useState } from "react";
import type { Materia } from "@/lib/types";
import Modal from "@/components/ui/Modal";

const COLORES = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

interface Props {
  materias: Materia[];
  onAgregar: (datos: Omit<Materia, "id">) => void;
  onEditar: (id: string, datos: Partial<Materia>) => void;
  onEliminar: (id: string) => void;
}

export default function GestorMaterias({ materias, onAgregar, onEditar, onEliminar }: Props) {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Materia | null>(null);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(COLORES[0]);

  function abrirNueva() {
    setEditando(null);
    setNombre("");
    setColor(COLORES[0]);
    setOpen(true);
  }

  function abrirEditar(m: Materia) {
    setEditando(m);
    setNombre(m.nombre);
    setColor(m.color);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (editando) {
      onEditar(editando.id, { nombre: nombre.trim(), color });
    } else {
      onAgregar({ nombre: nombre.trim(), color });
    }
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Materias</h3>
        <button
          onClick={abrirNueva}
          className="text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          + Agregar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {materias.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => abrirEditar(m)}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: m.color }}
            />
            <span className="text-gray-700">{m.nombre}</span>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editando ? "Editar materia" : "Nueva materia"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la materia"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {editando && (
              <button
                type="button"
                onClick={() => { onEliminar(editando.id); setOpen(false); }}
                className="px-4 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim()}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {editando ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
