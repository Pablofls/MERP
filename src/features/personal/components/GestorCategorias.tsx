"use client";
import { useState } from "react";
import type { CategoriaPersonal } from "@/lib/types";
import Modal from "@/components/ui/Modal";

const COLORES = [
  "#1e4976", "#7c5c2e", "#1a5c3e", "#7c2d2d", "#4a3a6b",
  "#2d6090", "#5c7a1a", "#6b3a1a", "#1a4a5c", "#5c1a4a",
];

interface Props {
  categorias: CategoriaPersonal[];
  onAgregar: (nombre: string, color: string) => void;
  onEliminar: (id: string) => void;
}

export default function GestorCategorias({ categorias, onAgregar, onEliminar }: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(COLORES[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAgregar(nombre.trim(), color);
    setNombre("");
    setColor(COLORES[0]);
    setOpen(false);
  }

  return (
    <div data-tutorial-id="gestor-categorias">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categorías</h3>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-gray-200 bg-white text-xs group cursor-default"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-gray-700">{c.nombre}</span>
            <button
              type="button"
              onClick={() => onEliminar(c.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all -mr-0.5"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva categoría">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la categoría"
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
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim()}
              className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-40 transition-colors"
            >
              Agregar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
