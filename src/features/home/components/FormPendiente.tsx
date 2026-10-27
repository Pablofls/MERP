"use client";
import { useState } from "react";
import type { Pendiente, Materia, CategoriaPersonal } from "@/lib/types";
import { fechaHoy } from "@/lib/utils";

interface Props {
  materias: Materia[];
  categorias: CategoriaPersonal[];
  tipoPredeterminado?: "escolar" | "personal";
  onSubmit: (datos: Omit<Pendiente, "id" | "completado">, subtareas: string[]) => void;
  onCancel: () => void;
}

function valorInicial(
  tipoPredeterminado: "escolar" | "personal" | undefined,
  materias: Materia[],
  categorias: CategoriaPersonal[]
): string {
  if (tipoPredeterminado === "personal") return categorias[0] ? `p:${categorias[0].id}` : "";
  return materias[0] ? `m:${materias[0].id}` : categorias[0] ? `p:${categorias[0].id}` : "";
}

export default function FormPendiente({ materias, categorias, tipoPredeterminado, onSubmit, onCancel }: Props) {
  const [categoria, setCategoria] = useState(() => valorInicial(tipoPredeterminado, materias, categorias));
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [subtareas, setSubtareas] = useState<string[]>([]);
  const [nuevaSub, setNuevaSub] = useState("");

  function agregarSub() {
    if (!nuevaSub.trim()) return;
    setSubtareas((prev) => [...prev, nuevaSub.trim()]);
    setNuevaSub("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !categoria) return;

    let tipo: "escolar" | "personal";
    let materiaId: string | undefined;
    let categoriaPersonalId: string | undefined;

    if (categoria.startsWith("m:")) {
      tipo = "escolar";
      materiaId = categoria.slice(2);
    } else {
      tipo = "personal";
      categoriaPersonalId = categoria.slice(2);
    }

    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fechaLimite: fechaLimite || undefined,
      tipo,
      materiaId,
      categoriaPersonalId,
    }, nuevaSub.trim() ? [...subtareas, nuevaSub.trim()] : subtareas);
  }

  const soloEscolar = tipoPredeterminado === "escolar";
  const soloPersonal = tipoPredeterminado === "personal";
  const mostrarAmbos = !soloEscolar && !soloPersonal;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categoría</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
        >
          {soloPersonal ? (
            categorias.map((c) => (
              <option key={c.id} value={`p:${c.id}`}>{c.nombre}</option>
            ))
          ) : soloEscolar ? (
            materias.map((m) => (
              <option key={m.id} value={`m:${m.id}`}>{m.nombre}</option>
            ))
          ) : (
            <>
              {materias.length > 0 && (
                <optgroup label="Materias">
                  {materias.map((m) => (
                    <option key={m.id} value={`m:${m.id}`}>{m.nombre}</option>
                  ))}
                </optgroup>
              )}
              {categorias.length > 0 && (
                <optgroup label="Personal">
                  {categorias.map((c) => (
                    <option key={c.id} value={`p:${c.id}`}>{c.nombre}</option>
                  ))}
                </optgroup>
              )}
            </>
          )}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Titulo</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Que tienes pendiente?"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripcion</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalles opcionales"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subtareas</label>
        {subtareas.length > 0 && (
          <ul className="space-y-1 mb-2">
            {subtareas.map((sub, i) => (
              <li key={i} className="flex items-center gap-2 group py-1 px-2 -mx-2 rounded-md hover:bg-gray-50 transition-colors">
                <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700">{sub}</span>
                <button
                  type="button"
                  onClick={() => setSubtareas((prev) => prev.filter((_, j) => j !== i))}
                  title="Quitar subtarea"
                  aria-label="Quitar subtarea"
                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nuevaSub}
            onChange={(e) => setNuevaSub(e.target.value)}
            onKeyDown={(e) => {
              // Enter agrega la subtarea en lugar de enviar el formulario
              if (e.key === "Enter") { e.preventDefault(); agregarSub(); }
            }}
            placeholder="Agregar subtarea…"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900 placeholder:text-gray-300"
          />
          <button
            type="button"
            onClick={agregarSub}
            disabled={!nuevaSub.trim()}
            aria-label="Agregar subtarea"
            className="p-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-30 transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha limite</label>
        <input
          type="date"
          value={fechaLimite}
          min={fechaHoy()}
          onChange={(e) => setFechaLimite(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!titulo.trim() || !categoria}
          className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Agregar
        </button>
      </div>
    </form>
  );
}
