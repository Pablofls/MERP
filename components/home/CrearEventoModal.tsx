"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  open: boolean;
  fechaDefault: string; // YYYY-MM-DD
  onClose: () => void;
  onCreado: () => void;
}

function fechaHoy(): string {
  return new Date().toISOString().split("T")[0];
}

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function CrearEventoModal({ open, fechaDefault, onClose, onCreado }: Props) {
  const [titulo, setTitulo] = useState("");
  const [todoElDia, setTodoElDia] = useState(false);
  const [fecha, setFecha] = useState(fechaDefault);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setTitulo("");
      setTodoElDia(false);
      setFecha(fechaDefault);
      setHoraInicio("09:00");
      setHoraFin("10:00");
    }
  }, [open, fechaDefault]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setGuardando(true);
    try {
      const token = await getToken();
      if (!token) return;

      let inicio: string;
      let fin: string;

      if (todoElDia) {
        inicio = fecha;
        // All-day events: end date is exclusive in Google Calendar
        const finDate = new Date(fecha);
        finDate.setDate(finDate.getDate() + 1);
        fin = finDate.toISOString().split("T")[0];
      } else {
        inicio = new Date(`${fecha}T${horaInicio}`).toISOString();
        fin = new Date(`${fecha}T${horaFin}`).toISOString();
      }

      await fetch("/api/google/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "crear", titulo: titulo.trim(), inicio, fin, todoElDia }),
      });

      onCreado();
      onClose();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Nuevo evento</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <input
              autoFocus
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del evento"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-900"
            />
          </div>

          {/* Todo el día toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-500">Todo el día</span>
            <button
              type="button"
              onClick={() => setTodoElDia(!todoElDia)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                todoElDia ? "bg-blue-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  todoElDia ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900"
            />
          </div>

          {!todoElDia && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Inicio</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fin</label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-gray-600 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!titulo.trim() || guardando}
              className="flex-1 text-sm text-white bg-blue-900 rounded-lg py-2.5 hover:bg-blue-800 transition-colors disabled:opacity-40"
            >
              {guardando ? "Creando…" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
