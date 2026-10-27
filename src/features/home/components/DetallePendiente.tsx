"use client";
import { useState, useRef, useEffect } from "react";
import type { Pendiente, Materia, CategoriaPersonal } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { formatFechaCorta, esFechaVencida, cn } from "@/lib/utils";
import { useSubtareas } from "@/features/home/hooks/useSubtareas";
import { triggerConfetti } from "@/lib/confetti";

interface Props {
  pendiente: Pendiente | null;
  materias: Materia[];
  categorias: CategoriaPersonal[];
  onClose: () => void;
  onToggle: (id: string) => void;
  onEditar: (id: string, datos: Partial<Pick<Pendiente, "titulo" | "descripcion" | "fechaLimite" | "tipo" | "materiaId" | "categoriaPersonalId">>) => void;
  onEliminar: (id: string) => void;
}

export default function DetallePendiente({ pendiente, materias, categorias, onClose, onToggle, onEditar, onEliminar }: Props) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [categoria, setCategoria] = useState("");
  const [nuevaSubtarea, setNuevaSubtarea] = useState("");
  const [editandoSubId, setEditandoSubId] = useState<string | null>(null);
  const [textoSub, setTextoSub] = useState("");
  // Borrador de subtareas del modo edición: se aplica al guardar, se descarta al cancelar
  const [borradorSubs, setBorradorSubs] = useState<{ id: string | null; titulo: string; completado: boolean }[]>([]);
  const [nuevaSubBorrador, setNuevaSubBorrador] = useState("");
  // Evita que el blur al desmontar el input guarde de nuevo (o tras cancelar con Esc)
  const cancelandoSubRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const completarBtnRef = useRef<HTMLButtonElement>(null);

  const { subtareas, agregar, toggleCompletar, editar: editarSub, eliminar: eliminarSub } = useSubtareas(pendiente?.id ?? null);

  // Reset editing state when pendiente changes
  useEffect(() => {
    setEditando(false);
    setNuevaSubtarea("");
    setEditandoSubId(null);
  }, [pendiente?.id]);

  function abrirEdicion() {
    if (!pendiente) return;
    setTitulo(pendiente.titulo);
    setDescripcion(pendiente.descripcion ?? "");
    setFechaLimite(pendiente.fechaLimite ?? "");
    const cat = pendiente.tipo === "escolar"
      ? `m:${pendiente.materiaId ?? materias[0]?.id ?? ""}`
      : `p:${pendiente.categoriaPersonalId ?? categorias[0]?.id ?? ""}`;
    setCategoria(cat);
    setBorradorSubs(subtareas.map((s) => ({ id: s.id, titulo: s.titulo, completado: s.completado })));
    setNuevaSubBorrador("");
    setEditando(true);
  }

  function agregarSubBorrador() {
    if (!nuevaSubBorrador.trim()) return;
    setBorradorSubs((prev) => [...prev, { id: null, titulo: nuevaSubBorrador.trim(), completado: false }]);
    setNuevaSubBorrador("");
  }

  async function aplicarBorradorSubs() {
    const finales = nuevaSubBorrador.trim()
      ? [...borradorSubs, { id: null, titulo: nuevaSubBorrador.trim(), completado: false }]
      : borradorSubs;
    // Una subtarea existente que se dejó vacía cuenta como eliminada
    const conservadas = new Set(finales.filter((b) => b.id && b.titulo.trim()).map((b) => b.id));
    for (const s of subtareas) {
      if (!conservadas.has(s.id)) eliminarSub(s.id);
    }
    for (const b of finales) {
      if (b.id && b.titulo.trim()) editarSub(b.id, b.titulo);
    }
    // En secuencia para respetar el orden en que se escribieron
    for (const b of finales) {
      if (!b.id && b.titulo.trim()) await agregar(b.titulo);
    }
  }

  function cancelarEdicion() {
    setEditando(false);
  }

  function guardar() {
    if (!pendiente || !titulo.trim()) return;
    const esEscolar = categoria.startsWith("m:");
    onEditar(pendiente.id, {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fechaLimite: fechaLimite || undefined,
      tipo: esEscolar ? "escolar" : "personal",
      materiaId: esEscolar ? categoria.slice(2) : undefined,
      categoriaPersonalId: esEscolar ? undefined : categoria.slice(2),
    });
    aplicarBorradorSubs();
    setEditando(false);
    onClose();
  }

  function confirmarEliminar() {
    if (!pendiente) return;
    onEliminar(pendiente.id);
    onClose();
  }

  async function handleAgregarSubtarea(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaSubtarea.trim()) return;
    await agregar(nuevaSubtarea);
    setNuevaSubtarea("");
    inputRef.current?.focus();
  }

  function empezarEdicionSub(id: string, titulo: string) {
    cancelandoSubRef.current = false;
    setEditandoSubId(id);
    setTextoSub(titulo);
  }

  function guardarEdicionSub() {
    if (!editandoSubId || cancelandoSubRef.current) return;
    cancelandoSubRef.current = true;
    if (textoSub.trim()) editarSub(editandoSubId, textoSub);
    setEditandoSubId(null);
  }

  if (!pendiente) return null;

  const mat = materias.find((m) => m.id === pendiente.materiaId);
  const cat = categorias.find((c) => c.id === pendiente.categoriaPersonalId);
  const vencido = !pendiente.completado && pendiente.fechaLimite && esFechaVencida(pendiente.fechaLimite);
  const totalSub = subtareas.length;
  const completadasSub = subtareas.filter((s) => s.completado).length;

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
              <Badge color={cat?.color ?? "#4a3a6b"}>{cat?.nombre ?? "Personal"}</Badge>
            )}
            {pendiente.fechaLimite && (
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", vencido ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500")}>
                {vencido ? "Vencido · " : ""}{formatFechaCorta(pendiente.fechaLimite)}
              </span>
            )}
          </div>

          {/* Subtareas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Subtareas{totalSub > 0 ? ` · ${completadasSub}/${totalSub}` : ""}
              </p>
            </div>

            {subtareas.length > 0 && (
              <ul className="space-y-1 mb-2">
                {subtareas.map((sub) => (
                  <li key={sub.id} className="flex items-center gap-2 group py-1 px-2 -mx-2 rounded-md hover:bg-gray-50 transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleCompletar(sub.id)}
                      className={cn(
                        "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                        sub.completado
                          ? "bg-blue-900 border-blue-900"
                          : "border-gray-300 hover:border-blue-900"
                      )}
                    >
                      {sub.completado && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                    {editandoSubId === sub.id ? (
                      <input
                        type="text"
                        value={textoSub}
                        onChange={(e) => setTextoSub(e.target.value)}
                        onBlur={guardarEdicionSub}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); guardarEdicionSub(); }
                          // Que Esc cancele la edición sin cerrar el modal
                          if (e.key === "Escape") { e.stopPropagation(); cancelandoSubRef.current = true; setEditandoSubId(null); }
                        }}
                        className="flex-1 min-w-0 text-sm text-gray-700 border border-gray-200 rounded-md px-2 py-0.5 -my-0.5 focus:outline-none focus:border-blue-900"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span
                          onDoubleClick={() => empezarEdicionSub(sub.id, sub.titulo)}
                          className={cn(
                            "flex-1 text-sm transition-all duration-300",
                            sub.completado ? "line-through text-gray-400" : "text-gray-700"
                          )}
                        >
                          {sub.titulo}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => empezarEdicionSub(sub.id, sub.titulo)}
                            title="Editar subtarea"
                            aria-label="Editar subtarea"
                            className="p-1 rounded-md text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarSub(sub.id)}
                            title="Eliminar subtarea"
                            aria-label="Eliminar subtarea"
                            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Input nueva subtarea */}
            <form onSubmit={handleAgregarSubtarea} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={nuevaSubtarea}
                onChange={(e) => setNuevaSubtarea(e.target.value)}
                placeholder="Agregar subtarea…"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900 placeholder:text-gray-300"
              />
              <button
                type="submit"
                disabled={!nuevaSubtarea.trim()}
                className="p-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-30 transition-colors flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </form>
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
              ref={completarBtnRef}
              onClick={() => {
                if (!pendiente.completado && completarBtnRef.current) {
                  const rect = completarBtnRef.current.getBoundingClientRect();
                  triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                }
                onToggle(pendiente.id);
              }}
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
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
            >
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
            </select>
          </div>

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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subtareas</label>
            {borradorSubs.length > 0 && (
              <ul className="space-y-1 mb-2">
                {borradorSubs.map((sub, i) => (
                  <li key={sub.id ?? `nueva-${i}`} className="flex items-center gap-2 group py-1 px-2 -mx-2 rounded-md hover:bg-gray-50 transition-colors">
                    <span
                      className={cn(
                        "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center",
                        sub.completado ? "bg-blue-900 border-blue-900" : "border-gray-300"
                      )}
                    >
                      {sub.completado && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <input
                      type="text"
                      value={sub.titulo}
                      onChange={(e) => {
                        const titulo = e.target.value;
                        setBorradorSubs((prev) => prev.map((b, j) => j === i ? { ...b, titulo } : b));
                      }}
                      // Enter no debe enviar el formulario completo
                      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                      aria-label="Título de la subtarea"
                      className={cn(
                        "flex-1 min-w-0 text-sm bg-transparent border border-transparent rounded-md px-2 py-0.5 -my-0.5 -ml-2 focus:outline-none focus:border-blue-900 focus:bg-white",
                        sub.completado ? "line-through text-gray-400" : "text-gray-700"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setBorradorSubs((prev) => prev.filter((_, j) => j !== i))}
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
                value={nuevaSubBorrador}
                onChange={(e) => setNuevaSubBorrador(e.target.value)}
                onKeyDown={(e) => {
                  // Enter agrega la subtarea en lugar de enviar el formulario
                  if (e.key === "Enter") { e.preventDefault(); agregarSubBorrador(); }
                }}
                placeholder="Agregar subtarea…"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900 placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={agregarSubBorrador}
                disabled={!nuevaSubBorrador.trim()}
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
