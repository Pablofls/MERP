"use client";
import HorarioSemanal from "@/features/escolar/components/HorarioSemanal";
import FechasImportantes from "@/features/escolar/components/FechasImportantes";
import ListaPendientes from "@/features/home/components/ListaPendientes";
import { agruparPorDia } from "@/features/home/lib/agrupar";
import { estaEnSieteDias, fechaImportanteAPendiente } from "@/lib/utils";
import CarruselCapturas from "../../components/CarruselCapturas";
import { Encabezado, SeccionPendientes, nada } from "../Pantalla";
import { CLASES_DEMO, MATERIAS_DEMO, fechasImportantesDemo, pendientesEscolaresDemo } from "../demo";

// Mismo contenedor que src/app/escolar/page.tsx
const PAGINA = "max-w-5xl mx-auto px-4 pt-6 pb-6 space-y-6";

export default function CapturasEscolar() {
  const fechas = fechasImportantesDemo();
  // Igual que la página: las fechas importantes de los próximos 7 días se listan como pendientes
  const pendientes = [
    ...pendientesEscolaresDemo(),
    ...fechas.filter((f) => estaEnSieteDias(f.fecha)).map(fechaImportanteAPendiente),
  ];
  const encabezado = (
    <Encabezado titulo="Escolar" detalle={`${MATERIAS_DEMO.length} materias · ${CLASES_DEMO.length} clases`} accion="configurar" />
  );

  return (
    <CarruselCapturas
      capturas={[
        {
          titulo: "Horario y fechas importantes",
          ruta: "/escolar",
          contenido: (
            <div className={PAGINA}>
              {encabezado}
              <div className="flex flex-row gap-6">
                <section className="flex-1 min-w-0">
                  <HorarioSemanal clases={CLASES_DEMO} materias={MATERIAS_DEMO} vistaPrevia />
                </section>
                <aside className="w-72 flex-shrink-0">
                  <FechasImportantes fechas={fechas} materias={MATERIAS_DEMO} onAgregar={nada} onEditar={nada} onEliminar={nada} />
                </aside>
              </div>
            </div>
          ),
        },
        {
          titulo: "Pendientes por materia",
          ruta: "/escolar",
          contenido: (
            <div className={PAGINA}>
              {encabezado}
              <SeccionPendientes>
                <ListaPendientes
                  grupos={agruparPorDia(pendientes, "asc")}
                  materias={MATERIAS_DEMO}
                  categorias={[]}
                  onToggle={nada}
                  onSeleccionar={nada}
                />
              </SeccionPendientes>
            </div>
          ),
        },
      ]}
    />
  );
}
