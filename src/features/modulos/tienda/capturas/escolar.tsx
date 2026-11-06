"use client";
import HorarioSemanal from "@/features/escolar/components/HorarioSemanal";
import FechasImportantes from "@/features/escolar/components/FechasImportantes";
import ListaPendientes from "@/features/home/components/ListaPendientes";
import { agruparPorDia } from "@/features/home/lib/agrupar";
import { estaEnSieteDias, fechaImportanteAPendiente } from "@/lib/utils";
import CarruselCapturas from "../../components/CarruselCapturas";
import { Encabezado, Seccion, nada } from "../Pantalla";
import { CLASES_DEMO, MATERIAS_DEMO, fechasImportantesDemo, pendientesEscolaresDemo } from "../demo";

export default function CapturasEscolar() {
  const fechas = fechasImportantesDemo();
  // Igual que la página: las fechas importantes de los próximos 7 días se listan como pendientes
  const pendientes = [
    ...pendientesEscolaresDemo(),
    ...fechas.filter((f) => estaEnSieteDias(f.fecha)).map(fechaImportanteAPendiente),
  ];
  const encabezado = <Encabezado titulo="Escolar" detalle={`${MATERIAS_DEMO.length} materias · ${CLASES_DEMO.length} clases`} />;

  return (
    <CarruselCapturas
      capturas={[
        {
          titulo: "Horario semanal",
          contenido: (
            <>
              {encabezado}
              <HorarioSemanal clases={CLASES_DEMO} materias={MATERIAS_DEMO} vistaPrevia />
            </>
          ),
        },
        {
          titulo: "Pendientes por materia",
          contenido: (
            <>
              {encabezado}
              <Seccion titulo="Pendientes">
                <ListaPendientes
                  grupos={agruparPorDia(pendientes, "asc")}
                  materias={MATERIAS_DEMO}
                  categorias={[]}
                  onToggle={nada}
                  onSeleccionar={nada}
                />
              </Seccion>
            </>
          ),
        },
        {
          titulo: "Fechas importantes",
          contenido: (
            <>
              {encabezado}
              <FechasImportantes fechas={fechas} materias={MATERIAS_DEMO} onAgregar={nada} onEditar={nada} onEliminar={nada} />
            </>
          ),
        },
      ]}
    />
  );
}
