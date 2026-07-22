"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ClaseHorario, Materia, DiaSemana } from "@/lib/types";
import { DIAS_SHORT } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface Props {
  clases: ClaseHorario[];
  materias: Materia[];
  onAgregar: (datos: Omit<ClaseHorario, "id">) => void;
  onEliminar: (id: string) => void;
}

const DIAS_SEMANA_PICKER: { abbr: string; dia: DiaSemana }[] = [
  { abbr: "L", dia: "lunes" },
  { abbr: "M", dia: "martes" },
  { abbr: "X", dia: "miércoles" },
  { abbr: "J", dia: "jueves" },
  { abbr: "V", dia: "viernes" },
];

const DIA_TO_RRULE: Record<DiaSemana, string> = {
  lunes: "MO", martes: "TU", "miércoles": "WE",
  jueves: "TH", viernes: "FR", sábado: "SA", domingo: "SU",
};

const JS_TO_DIA: Record<number, DiaSemana> = {
  1: "lunes", 2: "martes", 3: "miércoles", 4: "jueves", 5: "viernes",
};

function diaDesdeISO(iso: string): DiaSemana {
  const dow = new Date(iso + "T12:00:00").getDay();
  return JS_TO_DIA[dow] ?? "lunes";
}

function hoy(): string {
  return new Date().toISOString().split("T")[0];
}

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function GestorClases({ clases, materias, onAgregar, onEliminar }: Props) {
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Form state
  const [materiaId, setMateriaId] = useState(materias[0]?.id ?? "");
  const [fechaInicio, setFechaInicio] = useState(hoy());
  const [horaInicio, setHoraInicio] = useState("07:00");
  const [horaFin, setHoraFin] = useState("09:00");
  const [seRepite, setSeRepite] = useState(false);
  const [diasSel, setDiasSel] = useState<DiaSemana[]>([]);
  const [fechaFin, setFechaFin] = useState("");
  const [salon, setSalon] = useState("");

  const diasConClases = ["lunes", "martes", "miércoles", "jueves", "viernes"] as DiaSemana[];
  const getMat = (id: string) => materias.find((m) => m.id === id);

  function openModal() {
    const f = hoy();
    setFechaInicio(f);
    setHoraInicio("07:00");
    setHoraFin("09:00");
    setSeRepite(false);
    setDiasSel([diaDesdeISO(f)]);
    setFechaFin("");
    setSalon("");
    setMateriaId(materias[0]?.id ?? "");
    setOpen(true);
  }

  function toggleDia(dia: DiaSemana) {
    setDiasSel((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  function handleFechaInicio(val: string) {
    setFechaInicio(val);
    if (!seRepite) setDiasSel([diaDesdeISO(val)]);
  }

  function handleToggleRepite() {
    const next = !seRepite;
    setSeRepite(next);
    if (next) setDiasSel([diaDesdeISO(fechaInicio)]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!materiaId) return;

    const mat = materias.find((m) => m.id === materiaId);
    const titulo = mat?.nombre ?? "Clase";
    const dias = seRepite ? diasSel : [diaDesdeISO(fechaInicio)];
    if (dias.length === 0) return;

    setGuardando(true);
    try {
      // Crear evento en Google Calendar (misma lógica que CrearEventoModal)
      const token = await getToken();
      if (token) {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const inicio = `${fechaInicio}T${horaInicio}:00`;
        const fin = `${fechaInicio}T${horaFin}:00`;

        let recurrence: string[] | undefined;
        if (seRepite && dias.length > 0) {
          const byDay = dias.map((d) => DIA_TO_RRULE[d]).join(",");
          let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`;
          if (fechaFin) {
            rrule += `;UNTIL=${fechaFin.replace(/-/g, "")}T235959Z`;
          }
          recurrence = [rrule];
        }

        await fetch("/api/google/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "crear", titulo, inicio, fin, todoElDia: false, timeZone, recurrence }),
        });
      }

      // Guardar en Supabase (un registro por día seleccionado)
      for (const dia of dias) {
        onAgregar({
          materiaId,
          dia,
          horaInicio,
          horaFin,
          salon: salon.trim() || undefined,
          fechaInicio: fechaInicio || null,
          fechaFin: (seRepite && fechaFin) ? fechaFin : (fechaInicio || null),
        });
      }

      setOpen(false);
      setSalon("");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clases</h3>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar clase
        </button>
      </div>

      {clases.length === 0 ? (
        <EmptyState title="Sin clases registradas" />
      ) : (
        <div className="space-y-1">
          {diasConClases.map((d) => {
            const clasesDelDia = clases.filter((c) => c.dia === d);
            if (!clasesDelDia.length) return null;
            return (
              <div key={d}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-2 pb-1">
                  {DIAS_SHORT[d]}
                </p>
                {clasesDelDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)).map((clase) => {
                  const mat = getMat(clase.materiaId);
                  return (
                    <div key={clase.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: mat?.color ?? "#94a3b8" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{mat?.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {clase.horaInicio} – {clase.horaFin}{clase.salon ? ` · ${clase.salon}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => onEliminar(clase.id)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal bottom-sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-sm shadow-xl max-h-[90dvh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-900">Nueva clase</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form — scrollable */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">

              {/* Materia */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Materia</label>
                <select
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-900 bg-white"
                >
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Fecha inicio */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => handleFechaInicio(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* Horas */}
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

              {/* Se repite toggle */}
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-500">Se repite semanalmente</span>
                <button
                  type="button"
                  onClick={handleToggleRepite}
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

              {/* Opciones de repetición */}
              {seRepite && (
                <div className="space-y-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Días</label>
                    <div className="flex gap-1.5">
                      {DIAS_SEMANA_PICKER.map(({ abbr, dia }) => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => toggleDia(dia)}
                          className={cn(
                            "flex-1 h-8 rounded-full text-xs font-semibold transition-colors",
                            diasSel.includes(dia)
                              ? "bg-blue-900 text-white"
                              : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                          )}
                        >
                          {abbr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Fecha de fin (opcional)</label>
                    <input
                      type="date"
                      value={fechaFin}
                      min={fechaInicio}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-900 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Salón */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Salón (opcional)</label>
                <input
                  type="text"
                  value={salon}
                  onChange={(e) => setSalon(e.target.value)}
                  placeholder="ej. A-201"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-sm text-gray-600 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!materiaId || (seRepite && diasSel.length === 0) || guardando}
                  className="flex-1 text-sm text-white bg-blue-900 rounded-lg py-2.5 hover:bg-blue-800 transition-colors disabled:opacity-40"
                >
                  {guardando ? "Creando…" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
