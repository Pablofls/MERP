"use client";
import type { ClaseHorario, Materia } from "@/lib/types";
import { DIAS_SEMANA, DIAS_SHORT, minutosDesdeMedianoche } from "@/lib/utils";

interface Props {
  clases: ClaseHorario[];
  materias: Materia[];
}

const HORA_INICIO = 7 * 60;  // 7:00
const HORA_FIN = 15 * 60;    // 15:00
const TOTAL_MINUTOS = HORA_FIN - HORA_INICIO;

const HORAS = Array.from({ length: 9 }, (_, i) => i + 7);

export default function HorarioSemanal({ clases, materias }: Props) {
  const getMat = (id: string) => materias.find((m) => m.id === id);
  const diasConClases = DIAS_SEMANA.slice(0, 5); // lun-vie

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Encabezado de días */}
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: "3rem repeat(5, 1fr)" }}>
        <div className="py-2" />
        {diasConClases.map((dia) => (
          <div key={dia} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-l border-gray-100">
            {DIAS_SHORT[dia]}
          </div>
        ))}
      </div>

      {/* Cuerpo del horario */}
      <div
        className="relative"
        style={{ gridTemplateColumns: "3rem repeat(5, 1fr)" }}
      >
        {/* Líneas de horas */}
        <div className="absolute inset-0 pointer-events-none">
          {HORAS.map((hora) => (
            <div
              key={hora}
              className="absolute left-0 right-0 border-t border-gray-50 flex items-start"
              style={{ top: `${((hora * 60 - HORA_INICIO) / TOTAL_MINUTOS) * 100}%` }}
            >
              <span className="w-12 text-right pr-2 text-[10px] text-gray-300 leading-none -mt-2">
                {hora}:00
              </span>
            </div>
          ))}
        </div>

        {/* Contenedor de clases */}
        <div className="ml-12 relative" style={{ height: `${TOTAL_MINUTOS * 1.2}px` }}>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {diasConClases.map((dia, colIdx) => {
              const clasesDelDia = clases
                .filter((c) => c.dia === dia)
                .sort((a, b) => minutosDesdeMedianoche(a.horaInicio) - minutosDesdeMedianoche(b.horaInicio));

              return (
                <div key={dia} className="relative border-l border-gray-100">
                  {clasesDelDia.map((clase) => {
                    const ini = minutosDesdeMedianoche(clase.horaInicio) - HORA_INICIO;
                    const dur = minutosDesdeMedianoche(clase.horaFin) - minutosDesdeMedianoche(clase.horaInicio);
                    const mat = getMat(clase.materiaId);
                    const top = (ini / TOTAL_MINUTOS) * 100;
                    const height = (dur / TOTAL_MINUTOS) * 100;

                    return (
                      <div
                        key={clase.id}
                        className="absolute left-0.5 right-0.5 rounded-lg overflow-hidden text-white"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          backgroundColor: mat?.color ?? "#94a3b8",
                        }}
                      >
                        <div className="p-1.5 h-full flex flex-col justify-start">
                          <p className="text-[10px] font-semibold leading-tight truncate">
                            {mat?.nombre ?? "Clase"}
                          </p>
                          {dur >= 60 && (
                            <p className="text-[9px] opacity-80 leading-tight">
                              {clase.horaInicio}
                            </p>
                          )}
                          {clase.salon && dur >= 90 && (
                            <p className="text-[9px] opacity-70 leading-tight truncate">
                              {clase.salon}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
