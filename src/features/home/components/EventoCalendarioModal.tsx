"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string | null;
  hangoutLink?: string | null;
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
type Frecuencia = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type FinTipo = "nunca" | "hasta" | "despues";

const FREQ_LABELS: { value: Frecuencia; label: string }[] = [
  { value: "DAILY",   label: "Diario"   },
  { value: "WEEKLY",  label: "Semanal"  },
  { value: "MONTHLY", label: "Mensual"  },
  { value: "YEARLY",  label: "Anual"    },
];

const JS_DAY_TO_RRULE = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const DIAS_LABEL = ["D", "L", "M", "X", "J", "V", "S"];

function buildRrule(frecuencia: Frecuencia, diasSemana: string[], finTipo: FinTipo, finFecha: string, finCont: number): string {
  let rule = `FREQ=${frecuencia}`;
  if (frecuencia === "WEEKLY" && diasSemana.length > 0) rule += `;BYDAY=${diasSemana.join(",")}`;
  if (finTipo === "hasta" && finFecha) rule += `;UNTIL=${finFecha.replace(/-/g, "")}T235959Z`;
  else if (finTipo === "despues" && finCont > 0) rule += `;COUNT=${finCont}`;
  return `RRULE:${rule}`;
}

function parseRrule(rrule: string): { frecuencia: Frecuencia; diasSemana: string[]; finTipo: FinTipo; finFecha: string; finCont: number } {
  const parts: Record<string, string> = {};
  rrule.replace("RRULE:", "").split(";").forEach((p) => {
    const eq = p.indexOf("=");
    if (eq > 0) parts[p.slice(0, eq)] = p.slice(eq + 1);
  });
  const frecuencia = (["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(parts.FREQ) ? parts.FREQ : "WEEKLY") as Frecuencia;
  const diasSemana = parts.BYDAY ? parts.BYDAY.split(",") : [];
  let finTipo: FinTipo = "nunca";
  let finFecha = "";
  let finCont = 10;
  if (parts.UNTIL) {
    finTipo = "hasta";
    const u = parts.UNTIL.replace(/[TZ].*/, "");
    finFecha = `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}`;
  } else if (parts.COUNT) {
    finTipo = "despues";
    finCont = Math.max(1, parseInt(parts.COUNT) || 10);
  }
  return { frecuencia, diasSemana, finTipo, finFecha, finCont };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function parseEventoDateTime(ev: EventoCalendario): { fecha: string; horaInicio: string; horaFin: string } {
  const defaultFecha = new Date().toISOString().split("T")[0];
  if (ev.todoElDia) {
    return { fecha: ev.inicio ? ev.inicio.slice(0, 10) : defaultFecha, horaInicio: "00:00", horaFin: "00:00" };
  }
  if (!ev.inicio) return { fecha: defaultFecha, horaInicio: "09:00", horaFin: "10:00" };
  const d = new Date(ev.inicio);
  const fecha = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const horaInicio = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  let horaFin = `${pad(d.getHours() + 1)}:${pad(d.getMinutes())}`;
  if (ev.fin) {
    const df = new Date(ev.fin);
    horaFin = `${pad(df.getHours())}:${pad(df.getMinutes())}`;
  }
  return { fecha, horaInicio, horaFin };
}

function formatFechaHora(inicio: string | null, fin: string | null, todoElDia: boolean): string {
  if (todoElDia || !inicio) return "Todo el día";
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
  const [todoElDia, setTodoElDia] = useState(false);
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [seRepite, setSeRepite] = useState(false);
  const [cargandoRrule, setCargandoRrule] = useState(false);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("WEEKLY");
  const [diasSemana, setDiasSemana] = useState<string[]>([]);
  const [finTipo, setFinTipo] = useState<FinTipo>("nunca");
  const [finFecha, setFinFecha] = useState("");
  const [finCont, setFinCont] = useState(10);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const esRecurrente = !!evento?.recurringEventId;

  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo);
      setDescripcion(evento.descripcion ?? "");
      setTodoElDia(evento.todoElDia);
      const { fecha: f, horaInicio: hi, horaFin: hf } = parseEventoDateTime(evento);
      setFecha(f);
      setHoraInicio(hi);
      setHoraFin(hf);
      setStep("vista");
      setEditScope("este");
      setSeRepite(false);
      setCargandoRrule(false);
      setFrecuencia("WEEKLY");
      setDiasSemana([]);
      setFinTipo("nunca");
      setFinFecha("");
      setFinCont(10);
    }
  }, [evento]);

  // Load current RRULE from base event when editing all occurrences
  useEffect(() => {
    if (step !== "editando" || editScope !== "todos" || !evento?.recurringEventId) return;
    setCargandoRrule(true);
    getToken().then(async (token) => {
      if (!token) { setCargandoRrule(false); return; }
      try {
        const res = await fetch(`/api/google/calendar?eventId=${encodeURIComponent(evento.recurringEventId!)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.recurrence) && data.recurrence.length > 0) {
          const rrule = data.recurrence.find((r: string) => r.startsWith("RRULE:"));
          if (rrule) {
            const parsed = parseRrule(rrule);
            setSeRepite(true);
            setFrecuencia(parsed.frecuencia);
            setDiasSemana(parsed.diasSemana);
            setFinTipo(parsed.finTipo);
            setFinFecha(parsed.finFecha);
            setFinCont(parsed.finCont);
          }
        }
      } finally {
        setCargandoRrule(false);
      }
    });
  }, [step, editScope, evento]);

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

  function toggleDia(abbr: string) {
    setDiasSemana((prev) => prev.includes(abbr) ? prev.filter((d) => d !== abbr) : [...prev, abbr]);
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      const token = await getToken();
      if (!token) return;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      let inicioVal: string;
      let finVal: string;
      if (todoElDia) {
        inicioVal = fecha;
        const finDate = new Date(fecha + "T12:00:00");
        finDate.setDate(finDate.getDate() + 1);
        finVal = finDate.toISOString().split("T")[0];
      } else {
        inicioVal = `${fecha}T${horaInicio}:00`;
        finVal = `${fecha}T${horaFin}:00`;
      }

      const recurrence = editScope === "todos"
        ? (seRepite ? [buildRrule(frecuencia, diasSemana, finTipo, finFecha, finCont)] : [])
        : undefined;

      await fetch("/api/google/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          eventId: evento!.id,
          titulo,
          descripcion,
          editarTodos: editScope === "todos",
          baseEventId: evento!.recurringEventId,
          inicio: inicioVal,
          fin: finVal,
          todoElDia,
          timeZone,
          ...(recurrence !== undefined && { recurrence }),
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
      <div className="relative bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-sm shadow-xl max-h-[90dvh] flex flex-col">

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
                {formatFechaHora(evento.inicio, evento.fin, evento.todoElDia)}
              </p>
              {esRecurrente && (
                <p className="text-xs text-gray-400 mt-0.5">Evento recurrente</p>
              )}
              {evento.hangoutLink && (
                <a
                  href={evento.hangoutLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-700 hover:text-blue-800 hover:underline"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 3.5H4C2.6 3.5 1.5 4.6 1.5 6v12c0 1.4 1.1 2.5 2.5 2.5h16c1.4 0 2.5-1.1 2.5-2.5V6C22.5 4.6 21.4 3.5 20 3.5zm-1 13.5l-4-2.8V15H5V9h10v.8L19 7v10z"/>
                  </svg>
                  Unirse a Google Meet
                </a>
              )}
              {evento.descripcion && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words">
                  {evento.descripcion.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                    /^https?:\/\//.test(part)
                      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">{part}</a>
                      : part
                  )}
                </p>
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
                  { scope: "este",       label: "Solo este evento"              },
                  { scope: "siguientes", label: "Este y los siguientes"         },
                  { scope: "todos",      label: "Todos los eventos de la serie" },
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
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
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

            {cargandoRrule ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">Cargando…</p>
              </div>
            ) : (
              <form onSubmit={handleGuardar} className="p-4 space-y-3 overflow-y-auto">
                {/* Título */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Título</label>
                  <input
                    autoFocus
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-900"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={2}
                    placeholder="Añade una descripción…"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-900 resize-none"
                  />
                </div>

                {/* Todo el día */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-500">Todo el día</span>
                  <button
                    type="button"
                    onClick={() => setTodoElDia(!todoElDia)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${todoElDia ? "bg-blue-900" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${todoElDia ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </div>

                {/* Fecha */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900"
                  />
                </div>

                {/* Horas */}
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

                {/* Recurrencia — solo para scope "todos" */}
                {editScope === "todos" && (
                  <>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-500">Se repite</span>
                      <button
                        type="button"
                        onClick={() => setSeRepite(!seRepite)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${seRepite ? "bg-blue-900" : "bg-gray-200"}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${seRepite ? "translate-x-4" : "translate-x-1"}`} />
                      </button>
                    </div>

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

                        {/* Días de la semana */}
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
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="finTipo" value="nunca" checked={finTipo === "nunca"} onChange={() => setFinTipo("nunca")} className="accent-blue-900" />
                              <span className="text-xs text-gray-700">Nunca</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="finTipo" value="hasta" checked={finTipo === "hasta"} onChange={() => setFinTipo("hasta")} className="accent-blue-900" />
                              <span className="text-xs text-gray-700 flex-shrink-0">El</span>
                              <input
                                type="date"
                                value={finFecha}
                                onChange={(e) => { setFinTipo("hasta"); setFinFecha(e.target.value); }}
                                className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-900 bg-white"
                              />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="finTipo" value="despues" checked={finTipo === "despues"} onChange={() => setFinTipo("despues")} className="accent-blue-900" />
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
                  </>
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
