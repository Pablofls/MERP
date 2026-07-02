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
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                tipo === "escolar"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              📚 Escolar
            </button>
            <button
              type="button"
              onClick={() => setTipo("personal")}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                tipo === "personal"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
              }`}
            >
              👤 Personal
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
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Título *</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="¿Qué tienes pendiente?"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalles opcionales..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha límite</label>
        <input
          type="date"
          value={fechaLimite}
          min={fechaHoy()}
          onChange={(e) => setFechaLimite(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!titulo.trim()}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Agregar
        </button>
      </div>
    </form>
  );
}
