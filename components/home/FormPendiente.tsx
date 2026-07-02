"use client";
import { useState } from "react";
import type { Pendiente, Materia } from "@/lib/types";
import { fechaHoy } from "@/lib/utils";

interface Props {
  materias: Materia[];
  tipoPredeterminado?: "escolar" | "personal";
  onSubmit: (datos: Omit<Pendiente, "id" | "completado">) => void;
  onCancel: () => void;
}

export default function FormPendiente({ materias, tipoPredeterminado, onSubmit, onCancel }: Props) {
  const [tipo, setTipo] = useState<"escolar" | "personal">(tipoPredeterminado ?? "escolar");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [materiaId, setMateriaId] = useState(materias[0]?.id ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fechaLimite: fechaLimite || undefined,
      tipo,
      materiaId: tipo === "escolar" ? materiaId : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!tipoPredeterminado && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("escolar")}
              className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                tipo === "escolar"
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              Escolar
            </button>
            <button
              type="button"
              onClick={() => setTipo("personal")}
              className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                tipo === "personal"
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              Personal
            </button>
          </div>
        </div>
      )}

      {tipo === "escolar" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Materia</label>
          <select
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white"
          >
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Titulo</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Que tienes pendiente?"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
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
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha limite</label>
        <input
          type="date"
          value={fechaLimite}
          min={fechaHoy()}
          onChange={(e) => setFechaLimite(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
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
          disabled={!titulo.trim()}
          className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Agregar
        </button>
      </div>
    </form>
  );
}
