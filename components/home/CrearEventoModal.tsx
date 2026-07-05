"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  fechaDefault: string; // YYYY-MM-DD
  onClose: () => void;
  onCreado: () => void;
}

type Frecuencia = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type FinTipo = "nunca" | "hasta" | "despues";

const FREQ_LABELS: { value: Frecuencia; label: string }[] = [
  { value: "DAILY",   label: "Diario"   },
  { value: "WEEKLY",  label: "Semanal"  },
  { value: "MONTHLY", label: "Mensual"  },
  { value: "YEARLY",  label: "Anual"    },
];

// JS getDay() → RRULE BYDAY abbrev (Sunday=0)
const JS_DAY_TO_RRULE = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const DIAS_LABEL = ["D", "L", "M", "X", "J", "V", "S"];

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function buildRrule(
  frecuencia: Frecuencia,
  diasSemana: string[],
  finTipo: FinTipo,
  finFecha: string,
  finCont: number,
): string {
  let rule = `FREQ=${frecuencia}`;
  if (frecuencia === "WEEKLY" && diasSemana.length > 0) {
    rule += `;BYDAY=${diasSemana.join(",")}`;
  }
  if (finTipo === "hasta" && finFecha) {
    // UNTIL must be in UTC: YYYYMMDDTHHMMSSZ
    const until = finFecha.replace(/-/g, "") + "T235959Z";
    rule += `;UNTIL=${until}`;
  } else if (finTipo === "despues" && finCont > 0) {
    rule += `;COUNT=${finCont}`;
  }
  return `RRULE:${rule}`;
}

export default function CrearEventoModal({ open, fechaDefault, onClose, onCreado }: Props) {
  const [titulo, setTitulo] = useState("");
  const [todoElDia, setTodoElDia] = useState(false);
  const [fecha, setFecha] = useState(fechaDefault);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [seRepite, setSeRepite] = useState(false);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("WEEKLY");
  const [diasSemana, setDiasSemana] = useState<string[]>([]);
  const [finTipo, setFinTipo] = useState<FinTipo>("nunca");
  const [finFecha, setFinFecha] = useState("");
  const [finCont, setFinCont] = useState(10);
  const [guardando, setGuardando] = useState(false);

  // Pre-select the event's weekday when switching to weekly
  useEffect(() => {
    if (fecha) {
      const dow = new Date(fecha + "T12:00:00").getDay();
      setDiasSemana([JS_DAY_TO_RRULE[dow]]);
    }
  }, [fecha, frecuencia]);

  useEffect(() => {
    if (open) {
      setTitulo("");
      setTodoElDia(false);
      setFecha(fechaDefault);
      setHoraInicio("09:00");
      setHoraFin("10:00");
      setSeRepite(false);
      setFrecuencia("WEEKLY");
      setFinTipo("nunca");
      setFinFecha("");
      setFinCont(10);
      const dow = new Date(fechaDefault + "T12:00:00").getDay();
      setDiasSemana([JS_DAY_TO_RRULE[dow]]);
    }
  }, [open, fechaDefault]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  function toggleDia(abbr: string) {
    setDiasSemana((prev) =>
      prev.includes(abbr) ? prev.filter((d) => d !== abbr) : [...prev, abbr]
    );
  }

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
        const finDate = new Date(fecha);
        finDate.setDate(finDate.getDate() + 1);
        fin = finDate.toISOString().split("T")[0];
      } else {
        inicio = new Date(`${fecha}T${horaInicio}`).toISOString();
        fin = new Date(`${fecha}T${horaFin}`).toISOString();
      }

      const recurrence = seRepite
        ? [buildRrule(frecuencia, diasSemana, finTipo, finFecha, finCont)]
        : undefined;

      await fetch("/api/google/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "crear", titulo: titulo.trim(), inicio, fin, todoElDia, recurrence }),
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
      <div className="relative bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-sm shadow-xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
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

        {/* Form — scrollable */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
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

          {/* Repetir toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-500">Se repite</span>
            <button
              type="button"
              onClick={() => setSeRepite(!seRepite)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                seRepite ? "bg-blue-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  seRepite ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Recurrence options */}
          {seRepite && (
            <div className="space-y-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
              {/* Frecuencia */}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Frecuencia</label>
                <div className="flex rounded-md border border-gray-200 divide-x divide-gray-200 overflow-hidden bg-white">
                  {FREQ_LABELS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFrecuencia(value)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium transition-colors",
                        frecuencia === value ? "bg-blue-900 text-white" : "text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Días de la semana (solo si WEEKLY) */}
              {frecuencia === "WEEKLY" && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Días</label>
                  <div className="flex gap-1">
                    {JS_DAY_TO_RRULE.map((abbr, jsDay) => (
                      <button
                        key={abbr}
                        type="button"
                        onClick={() => toggleDia(abbr)}
                        className={cn(
                          "flex-1 h-8 rounded-full text-xs font-semibold transition-colors",
                          diasSemana.includes(abbr)
                            ? "bg-blue-900 text-white"
                            : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        {DIAS_LABEL[jsDay]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Termina */}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Termina</label>
                <div className="space-y-2">
                  {/* Nunca */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="finTipo"
                      value="nunca"
                      checked={finTipo === "nunca"}
                      onChange={() => setFinTipo("nunca")}
                      className="accent-blue-900"
                    />
                    <span className="text-xs text-gray-700">Nunca</span>
                  </label>

                  {/* Hasta fecha */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="finTipo"
                      value="hasta"
                      checked={finTipo === "hasta"}
                      onChange={() => setFinTipo("hasta")}
                      className="accent-blue-900"
                    />
                    <span className="text-xs text-gray-700 flex-shrink-0">El</span>
                    <input
                      type="date"
                      value={finFecha}
                      onChange={(e) => { setFinTipo("hasta"); setFinFecha(e.target.value); }}
                      className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-900 bg-white"
                    />
                  </label>

                  {/* Después de N ocurrencias */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="finTipo"
                      value="despues"
                      checked={finTipo === "despues"}
                      onChange={() => setFinTipo("despues")}
                      className="accent-blue-900"
                    />
                    <span className="text-xs text-gray-700 flex-shrink-0">Después de</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={finCont}
                      onChange={(e) => { setFinTipo("despues"); setFinCont(Math.max(1, parseInt(e.target.value) || 1)); }}
                      className="w-14 text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-900 bg-white text-center"
                    />
                    <span className="text-xs text-gray-700">ocurrencias</span>
                  </label>
                </div>
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
