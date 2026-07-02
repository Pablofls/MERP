"use client";
import type { Habito, RegistroHabito } from "@/lib/types";

interface Props {
  habito: Habito;
  historial: RegistroHabito[];
}

export default function CalendarioHabito({ habito, historial }: Props) {
  const hoy = new Date();
  // Mostrar los últimos 35 días (5 semanas)
  const dias = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - (34 - i));
    return d.toISOString().split("T")[0];
  });

  function getValor(fecha: string) {
    return historial.find((r) => r.fecha === fecha)?.valor ?? 0;
  }

  function getColor(fecha: string) {
    const val = getValor(fecha);
    if (val === 0) return "bg-gray-100";
    if (habito.tipoMedida === "booleana") return "bg-emerald-400";
    return "bg-indigo-400";
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Historial (5 semanas)
      </h4>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {["L","M","X","J","V","S","D"].map((d) => (
          <div key={d} className="text-center text-[9px] text-gray-300 font-medium pb-1">{d}</div>
        ))}
        {/* Espacio vacío para alinear con el día correcto de la semana */}
        {Array.from({ length: (new Date(dias[0]).getDay() + 6) % 7 }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {dias.map((fecha) => {
          const val = getValor(fecha);
          const esFuturo = fecha > hoy.toISOString().split("T")[0];
          return (
            <div
              key={fecha}
              title={fecha + (val > 0 ? `: ${val}${habito.unidad ? " " + habito.unidad : ""}` : "")}
              className={`aspect-square rounded-sm transition-colors ${
                esFuturo ? "bg-gray-50" : getColor(fecha)
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
