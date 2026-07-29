"use client";
import { useState } from "react";
import type { CategoriaPersonal } from "@/lib/types";

interface Props {
  categorias: CategoriaPersonal[];
  onAgregar: (nombre: string) => void;
  onEliminar: (id: string) => void;
}

export default function GestorCategorias({ categorias, onAgregar, onEliminar }: Props) {
  const [nueva, setNueva] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nueva.trim()) return;
    onAgregar(nueva.trim());
    setNueva("");
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categorías</h3>
      <ul className="space-y-1 mb-3">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center justify-between group py-1.5 px-2 rounded-lg hover:bg-gray-50">
            <span className="text-sm text-gray-700">{c.nombre}</span>
            <button
              type="button"
              onClick={() => onEliminar(c.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nueva categoría…"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900 placeholder:text-gray-300"
        />
        <button
          type="submit"
          disabled={!nueva.trim()}
          className="p-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-30 transition-colors flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </form>
    </div>
  );
}
