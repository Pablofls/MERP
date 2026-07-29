"use client";
import { useState } from "react";
import type { Pendiente, Materia, CategoriaPersonal } from "@/lib/types";
import { fechaHoy } from "@/lib/utils";

interface Props {
  materias: Materia[];
  categorias: CategoriaPersonal[];
  tipoPredeterminado?: "escolar" | "personal";
  onSubmit: (datos: Omit<Pendiente, "id" | "completado">) => void;
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
    });
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
