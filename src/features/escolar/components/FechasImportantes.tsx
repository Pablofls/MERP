"use client";
import { useState } from "react";
import type { FechaImportante, TipoEvaluacion, Materia } from "@/lib/types";
import { formatFechaCorta, esFechaVencida, fechaHoy, cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

const TIPOS: { value: TipoEvaluacion; label: string }[] = [
  { value: "examen_final", label: "Examen final" },
  { value: "examen_parcial", label: "Examen parcial" },
  { value: "quiz", label: "Quiz" },
  { value: "proyecto", label: "Proyecto" },
];

const COLORES_TIPO: Record<TipoEvaluacion, string> = {
  examen_final: "#7f1d1d",
  examen_parcial: "#92400e",
  quiz: "#1e3a5f",
  proyecto: "#14532d",
};

export function etiquetaTipo(tipo: TipoEvaluacion): string {
  return TIPOS.find((t) => t.value === tipo)?.label ?? tipo;
}

export function colorTipo(tipo: TipoEvaluacion): string {
  return COLORES_TIPO[tipo];
}

interface FormData {
  titulo: string;
  descripcion: string;
  fecha: string;
  materiaId: string;
  tipo: TipoEvaluacion;
}

function FormFechaImportante({
  materias,
  inicial,
  onSubmit,
  onCancel,
}: {
  materias: Materia[];
  inicial?: Partial<FormData>;
  onSubmit: (datos: Omit<FechaImportante, "id" | "completado">) => void;
  onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [fecha, setFecha] = useState(inicial?.fecha ?? "");
  const [materiaId, setMateriaId] = useState(inicial?.materiaId ?? (materias[0]?.id ?? ""));
  const [tipo, setTipo] = useState<TipoEvaluacion>(inicial?.tipo ?? "examen_parcial");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !fecha) return;
    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fecha,
      materiaId: materiaId || undefined,
      tipo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Materia</label>
        <select
          value={materiaId}
          onChange={(e) => setMateriaId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
        >
          <option value="">Sin materia</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoEvaluacion)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Titulo</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Parcial 1 — Cálculo"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripcion</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Temas, salón, notas..."
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha</label>
        <input
          type="date"
          value={fecha}
          min={fechaHoy()}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          required
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
          disabled={!titulo.trim() || !fecha}
          className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {inicial ? "Guardar" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

interface Props {
  fechas: FechaImportante[];
  materias: Materia[];
  onAgregar: (datos: Omit<FechaImportante, "id" | "completado">) => void;
  onEditar: (id: string, datos: Partial<Omit<FechaImportante, "id">>) => void;
  onEliminar: (id: string) => void;
}

export default function FechasImportantes({ fechas, materias, onAgregar, onEditar, onEliminar }: Props) {
  const [modalAgregar, setModalAgregar] = useState(false);
  const [editando, setEditando] = useState<FechaImportante | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null);

  const getMat = (id?: string) => materias.find((m) => m.id === id);

  const hoy = fechaHoy();
  const limite7 = new Date();
  limite7.setDate(limite7.getDate() + 7);
  const limite7Str = limite7.toISOString().split("T")[0];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Fechas importantes</h2>
          <p className="text-xs text-gray-400 mt-0.5">{fechas.length} registradas</p>
        </div>
        <button
          onClick={() => setModalAgregar(true)}
          className="flex items-center gap-1 bg-blue-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar
        </button>
      </div>

      {/* Lista */}
      {fechas.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-gray-400">Sin fechas registradas</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {fechas.map((f) => {
            const mat = getMat(f.materiaId);
            const vencida = esFechaVencida(f.fecha);
            const proxima = !vencida && f.fecha >= hoy && f.fecha <= limite7Str;
            return (
              <li
                key={f.id}
                className={cn(
                  "px-4 py-3 group",
                  proxima && "bg-amber-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium leading-snug truncate", vencida && "text-gray-400 line-through")}>
                      {f.titulo}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge color={colorTipo(f.tipo)}>{etiquetaTipo(f.tipo)}</Badge>
                      {mat && <Badge color={mat.color}>{mat.nombre}</Badge>}
                      <span className={cn("text-xs", vencida ? "text-gray-400" : proxima ? "text-amber-700 font-semibold" : "text-gray-400")}>
                        {vencida ? "Pasó · " : proxima ? "Próximo · " : ""}{formatFechaCorta(f.fecha)}
                      </span>
                    </div>
                    {f.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{f.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => setEditando(f)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmarEliminar(f.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal agregar */}
      <Modal open={modalAgregar} onClose={() => setModalAgregar(false)} title="Nueva fecha importante">
        <FormFechaImportante
          materias={materias}
          onSubmit={(datos) => { onAgregar(datos); setModalAgregar(false); }}
          onCancel={() => setModalAgregar(false)}
        />
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar fecha importante">
        {editando && (
          <FormFechaImportante
            materias={materias}
            inicial={{
              titulo: editando.titulo,
              descripcion: editando.descripcion,
              fecha: editando.fecha,
              materiaId: editando.materiaId,
              tipo: editando.tipo,
            }}
            onSubmit={(datos) => {
              onEditar(editando.id, datos);
              setEditando(null);
            }}
            onCancel={() => setEditando(null)}
          />
        )}
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal open={!!confirmarEliminar} onClose={() => setConfirmarEliminar(null)} title="Eliminar fecha">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">¿Eliminar esta fecha importante? No se puede deshacer.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmarEliminar(null)}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onEliminar(confirmarEliminar!); setConfirmarEliminar(null); }}
              className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
