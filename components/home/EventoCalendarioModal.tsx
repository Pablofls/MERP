"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string | null;
  inicio: string | null;
  fin: string | null;
  todoElDia: boolean;
  recurringEventId?: string | null;
}

interface Props {
  evento: EventoCalendario | null;
  onClose: () => void;
  onRefetch: () => void;
}

type Step = "vista" | "scopeEditar" | "editando" | "scopeEliminar";
type EditScope = "este" | "todos";
type DeleteScope = "este" | "siguientes" | "todos";

function toLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatFechaHora(inicio: string | null, fin: string | null): string {
  if (!inicio) return "Todo el día";
  const d = new Date(inicio);
  const fecha = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const horaI = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  const horaF = fin
    ? new Date(fin).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";
  return `${fecha} · ${horaI}${horaF ? ` – ${horaF}` : ""}`;
}

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function EventoCalendarioModal({ evento, onClose, onRefetch }: Props) {
  const [step, setStep] = useState<Step>("vista");
  const [editScope, setEditScope] = useState<EditScope>("este");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const esRecurrente = !!evento?.recurringEventId;

  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo);
      setDescripcion(evento.descripcion ?? "");
      setInicio(evento.inicio ? toLocal(evento.inicio) : "");
      setFin(evento.fin ? toLocal(evento.fin) : "");
      setStep("vista");
      setEditScope("este");
    }
  }, [evento]);

  useEffect(() => {
    if (!evento) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step !== "vista") setStep("vista");
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [evento, step, onClose]);

  if (!evento) return null;

  function handleClickEditar() {
    if (esRecurrente) setStep("scopeEditar");
    else { setStep("editando"); setEditScope("este"); }
  }

  function handleClickEliminar() {
    if (esRecurrente) setStep("scopeEliminar");
    else handleEliminar("este");
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      const token = await getToken();
      if (!token) return;
      await fetch("/api/google/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          eventId: evento!.id,
          titulo,
          descripcion,
          editarTodos: editScope === "todos",
          baseEventId: evento!.recurringEventId,
          // Only send times for "este" scope (for "todos" the API ignores them)
          ...(editScope === "este" && inicio && { inicio: new Date(inicio).toISOString() }),
          ...(editScope === "este" && fin && { fin: new Date(fin).toISOString() }),
        }),
      });
      onRefetch();
      onClose();
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(scope: DeleteScope) {
    setEliminando(true);
    try {
      const token = await getToken();
      if (!token) return;
      await fetch("/api/google/calendar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          eventId: evento!.id,
          scope,
          baseEventId: evento!.recurringEventId,
          occurrenceStart: evento!.inicio,
        }),
      });
      onRefetch();
      onClose();
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-sm shadow-xl">

        {/* ── VISTA ── */}
        {(step === "vista" || step === "scopeEditar" || step === "scopeEliminar") && (
          <>
            <div className="flex items-start gap-3 p-4 pb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-900 flex-shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 break-words">{evento.titulo}</h3>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0 -mt-0.5">
                {step === "vista" && (
                  <>
                    <button
                      onClick={handleClickEditar}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={handleClickEliminar}
                      disabled={eliminando}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  onClick={() => step !== "vista" ? setStep("vista") : onClose()}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-4 pb-3 pl-9">
              <p className="text-sm text-gray-500 capitalize">
                {formatFechaHora(evento.inicio, evento.fin)}
              </p>
              {esRecurrente && (
                <p className="text-xs text-gray-400 mt-0.5">Evento recurrente</p>
              )}
              {evento.descripcion && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{evento.descripcion}</p>
              )}
            </div>

            {/* Scope picker — editar */}
            {step === "scopeEditar" && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-1">
                <p className="text-xs font-medium text-gray-500 mb-2">¿Qué eventos editar?</p>
                {(["este", "todos"] as EditScope[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setEditScope(s); setStep("editando"); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {s === "este" ? "Solo este evento" : "Todos los eventos de la serie"}
                  </button>
                ))}
              </div>
            )}

            {/* Scope picker — eliminar */}
            {step === "scopeEliminar" && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-1">
                <p className="text-xs font-medium text-gray-500 mb-2">¿Qué eventos eliminar?</p>
                {([
                  { scope: "este",      label: "Solo este evento"             },
                  { scope: "siguientes", label: "Este y los siguientes"       },
                  { scope: "todos",     label: "Todos los eventos de la serie" },
                ] as { scope: DeleteScope; label: string }[]).map(({ scope, label }) => (
                  <button
                    key={scope}
                    onClick={() => handleEliminar(scope)}
                    disabled={eliminando}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50",
                      scope === "todos"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── EDITANDO ── */}
        {step === "editando" && (
          <>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(esRecurrente ? "scopeEditar" : "vista")}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <h3 className="text-sm font-semibold text-gray-900">
                  {editScope === "todos" ? "Editar todos" : "Editar evento"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Título</label>
                <input
                  autoFocus
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-900"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Añade una descripción…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-900 resize-none"
                />
              </div>

              {!evento.todoElDia && editScope === "este" && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Inicio</label>
                    <input
                      type="datetime-local"
                      value={inicio}
                      onChange={(e) => setInicio(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Fin</label>
                    <input
                      type="datetime-local"
                      value={fin}
                      onChange={(e) => setFin(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </>
              )}

              {editScope === "todos" && (
                <p className="text-xs text-gray-400">
                  Se cambia el título y la descripción en todos los eventos de la serie.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(esRecurrente ? "scopeEditar" : "vista")}
                  className="flex-1 text-sm text-gray-600 border border-gray-200 rounded-md py-2 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !titulo.trim()}
                  className="flex-1 text-sm text-white bg-blue-900 rounded-md py-2 hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
