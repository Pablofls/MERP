"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface EventoCalendario {
  id: string;
  titulo: string;
  inicio: string | null;
  fin: string | null;
  todoElDia: boolean;
}

interface Props {
  evento: EventoCalendario | null;
  onClose: () => void;
  onRefetch: () => void;
}

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
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo);
      setInicio(evento.inicio ? toLocal(evento.inicio) : "");
      setFin(evento.fin ? toLocal(evento.fin) : "");
      setEditando(false);
    }
  }, [evento]);

  useEffect(() => {
    if (!evento) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [evento, onClose]);

  if (!evento) return null;

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
          ...(inicio && { inicio: new Date(inicio).toISOString() }),
          ...(fin && { fin: new Date(fin).toISOString() }),
        }),
      });
      onRefetch();
      onClose();
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    setEliminando(true);
    try {
      const token = await getToken();
      if (!token) return;
      await fetch("/api/google/calendar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: evento!.id }),
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
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-900 flex-shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            {editando ? (
              <input
                autoFocus
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full text-base font-semibold text-gray-900 border-b border-gray-300 focus:border-blue-900 outline-none pb-0.5 bg-transparent"
              />
            ) : (
              <h3 className="text-base font-semibold text-gray-900 break-words">{evento.titulo}</h3>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0 -mt-0.5">
            {!editando && (
              <>
                <button
                  onClick={() => setEditando(true)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={handleEliminar}
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
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Vista: fecha y hora */}
        {!editando && (
          <div className="px-4 pb-4 pl-9">
            <p className="text-sm text-gray-500 capitalize">
              {formatFechaHora(evento.inicio, evento.fin)}
            </p>
          </div>
        )}

        {/* Edición: formulario */}
        {editando && (
          <form onSubmit={handleGuardar} className="px-4 pb-4 pl-9 space-y-3">
            {!evento.todoElDia && (
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
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="flex-1 text-sm text-gray-600 border border-gray-200 rounded-md py-1.5 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 text-sm text-white bg-blue-900 rounded-md py-1.5 hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
