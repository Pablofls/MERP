"use client";
import type { ClaseHorario, Materia } from "@/lib/types";
import { getDiaSemanaActual, minutosDesdeMedianoche } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

interface Props {
  clases: ClaseHorario[];
  materias: Materia[];
}

export default function AgendaHoy({ clases, materias }: Props) {
  const diaHoy = getDiaSemanaActual();
  const clasesHoy = clases
    .filter((c) => c.dia === diaHoy)
    .sort((a, b) => minutosDesdeMedianoche(a.horaInicio) - minutosDesdeMedianoche(b.horaInicio));

  const getMat = (id: string) => materias.find((m) => m.id === id);
  const horaActual = new Date().getHours() * 60 + new Date().getMinutes();

  function getEstado(clase: ClaseHorario) {
    const ini = minutosDesdeMedianoche(clase.horaInicio);
    const fin = minutosDesdeMedianoche(clase.horaFin);
    if (horaActual >= ini && horaActual < fin) return "activa";
    if (horaActual >= fin) return "pasada";
    return "futura";
  }

  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Hoy</h2>
        <p className="text-xs text-gray-400 capitalize mt-0.5">{fechaStr}</p>
      </div>

      {clasesHoy.length === 0 ? (
        <EmptyState title="Sin clases hoy" />
      ) : (
        <div className="space-y-1.5">
          {clasesHoy.map((clase) => {
            const mat = getMat(clase.materiaId);
            const estado = getEstado(clase);
            return (
              <div
                key={clase.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                  estado === "activa"
                    ? "border-blue-200 bg-blue-50"
                    : estado === "pasada"
                    ? "border-gray-100 bg-gray-50 opacity-50"
                    : "border-gray-100 bg-white"
                }`}
              >
                <div
                  className="w-0.5 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: mat?.color ?? "#94a3b8" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium truncate">
                    {mat?.nombre ?? "Clase"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {clase.horaInicio} – {clase.horaFin}
                    {clase.salon ? ` · ${clase.salon}` : ""}
                  </p>
                </div>
                {estado === "activa" && (
                  <span className="text-xs font-medium text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    Ahora
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
