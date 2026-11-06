"use client";
import TarjetaHabito from "@/features/habitos/components/TarjetaHabito";
import CalendarioHabitos from "@/features/habitos/components/CalendarioHabitos";
import { getHabitColorByIndex } from "@/lib/utils";
import CarruselCapturas from "../../components/CarruselCapturas";
import { Encabezado, nada } from "../Pantalla";
import { HABITOS_DEMO, registrosHabitosDemo, resumenHabitosDemo } from "../demo";

export default function CapturasHabitos() {
  const registros = registrosHabitosDemo();
  const r = resumenHabitosDemo(registros);
  const completados = registros.filter((x) => x.fecha === r.hoy && x.valor > 0).length;
  const encabezado = <Encabezado titulo="Hábitos" detalle={`${completados} / ${HABITOS_DEMO.length} completados hoy`} />;

  return (
    <CarruselCapturas
      capturas={[
        {
          titulo: "Registro del día",
          contenido: (
            <>
              {encabezado}
              <div className="space-y-2">
                {HABITOS_DEMO.map((h, idx) => (
                  <TarjetaHabito
                    key={h.id}
                    habito={h}
                    colorIndex={idx}
                    fecha={r.hoy}
                    registroDia={r.registroDia(h.id)}
                    racha={r.racha[h.id] ?? 0}
                    conteoSemana={h.frecuencia === "semanal" && !h.metaCantidadSemanal ? r.conteoSemana(h.id) : undefined}
                    sumaSemana={h.frecuencia === "semanal" && h.metaCantidadSemanal ? r.sumaSemana(h.id) : undefined}
                    onRegistrar={nada}
                    onEditar={nada}
                  />
                ))}
              </div>
            </>
          ),
        },
        {
          titulo: "Tu constancia",
          contenido: (
            <>
              {encabezado}
              <CalendarioHabitos habitos={HABITOS_DEMO} registros={registros} selectedDate={r.hoy} onDayClick={nada} />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
                {HABITOS_DEMO.map((h, idx) => (
                  <div key={h.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getHabitColorByIndex(idx) }} />
                    <span className="text-xs text-gray-500">{h.topico}</span>
                  </div>
                ))}
              </div>
            </>
          ),
        },
      ]}
    />
  );
}
