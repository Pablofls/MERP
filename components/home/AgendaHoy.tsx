"use client";
import type { ClaseHorario, Materia } from "@/lib/types";
import { getDiaSemanaActual, minutosDesdeMedianoche } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
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
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Hoy</h2>
          <p className="text-xs text-gray-500 capitalize">{fechaStr}</p>
        </div>
      </div>

      {clasesHoy.length === 0 ? (
        <EmptyState icon="🎉" title="Sin clases hoy" description="¡Día libre de clases!" />
      ) : (
        <div className="space-y-2">
          {clasesHoy.map((clase) => {
            const mat = getMat(clase.materiaId);
            const estado = getEstado(clase);
            return (
              <div
                key={clase.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  estado === "activa"
                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                    : estado === "pasada"
                    ? "border-gray-100 bg-gray-50 opacity-60"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: mat?.color ?? "#94a3b8" }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${estado === "pasada" ? "text-gray-400" : "text-gray-900"}`}>
                    {mat?.nombre ?? "Clase"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {clase.horaInicio} – {clase.horaFin}
                    {clase.salon ? ` · ${clase.salon}` : ""}
                  </p>
                </div>
                {estado === "activa" && (
                  <Badge color="#6366f1">Ahora</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
