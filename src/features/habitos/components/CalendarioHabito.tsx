"use client";
import type { Habito, RegistroHabito } from "@/lib/types";
import { fechaHoy, getHabitColorByIndex } from "@/lib/utils";

interface Props {
  habito: Habito;
  colorIndex: number;
  historial: RegistroHabito[];
}

export default function CalendarioHabito({ habito, colorIndex, historial }: Props) {
  const hoyStr = fechaHoy();
  const habitColor = getHabitColorByIndex(colorIndex);
  const dias = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(hoyStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - (34 - i));
    return d.toISOString().split("T")[0];
  });

  function getValor(fecha: string) {
    return historial.find((r) => r.fecha === fecha)?.valor ?? 0;
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Ultimas 5 semanas
      </h4>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {["L","M","X","J","V","S","D"].map((d) => (
          <div key={d} className="text-center text-[9px] text-gray-300 font-medium pb-1">{d}</div>
        ))}
        {Array.from({ length: (new Date(dias[0]).getDay() + 6) % 7 }, (_, i) => (
          <div key={`e-${i}`} />
        ))}
        {dias.map((fecha) => {
          const val = getValor(fecha);
          const futuro = fecha > hoyStr;
          const completado = val > 0;
          return (
            <div
              key={fecha}
              title={completado ? `${fecha}: ${val}${habito.unidad ? " " + habito.unidad : ""}` : fecha}
              className="aspect-square rounded-sm transition-colors"
              style={{
                backgroundColor: futuro ? "transparent" : completado ? habitColor : "#f3f4f6",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
