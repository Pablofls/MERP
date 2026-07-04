"use client";
import { useState } from "react";
import type { Materia } from "@/lib/types";
import Modal from "@/components/ui/Modal";

const COLORES = [
  "#1e4976", "#7c5c2e", "#1a5c3e", "#7c2d2d", "#4a3a6b",
  "#2d6090", "#5c7a1a", "#6b3a1a", "#1a4a5c", "#5c1a4a",
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
    setEditando(null); setNombre(""); setColor(COLORES[0]); setOpen(true);
  }
  function abrirEditar(m: Materia) {
    setEditando(m); setNombre(m.nombre); setColor(m.color); setOpen(true);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (editando) onEditar(editando.id, { nombre: nombre.trim(), color });
    else onAgregar({ nombre: nombre.trim(), color });
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Materias</h3>
        <button onClick={abrirNueva} className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {materias.map((m) => (
          <div
            key={m.id}
            onClick={() => abrirEditar(m)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-gray-200 bg-white text-xs cursor-pointer hover:border-gray-300 transition-colors"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
            <span className="text-gray-700">{m.nombre}</span>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editando ? "Editar materia" : "Nueva materia"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la materia"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
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
                  className="w-7 h-7 rounded transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
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
                className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Eliminar
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={!nombre.trim()} className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-40 transition-colors">
              {editando ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
