"use client";
import ListaPendientes from "@/features/home/components/ListaPendientes";
import CalendarioSemana from "@/features/personal/components/CalendarioSemana";
import GestorCategorias from "@/features/personal/components/GestorCategorias";
import { agruparPorDia } from "@/features/home/lib/agrupar";
import { fechaHoy } from "@/lib/utils";
import CarruselCapturas from "../../components/CarruselCapturas";
import { Encabezado, Seccion, SeccionPendientes, nada } from "../Pantalla";
import { CATEGORIAS_DEMO, pendientesPersonalesDemo } from "../demo";

// Mismo contenedor que src/app/personal/page.tsx
const PAGINA = "max-w-2xl mx-auto px-4 pt-6 pb-6 space-y-6";

export default function CapturasPersonal() {
  const pendientes = pendientesPersonalesDemo();
  const encabezado = (
    <Encabezado
      titulo="Personal"
      detalle={`${pendientes.length} pendientes · ${CATEGORIAS_DEMO.length} categorías`}
      accion="configurar"
    />
  );
  const lista = (
    <SeccionPendientes>
      <ListaPendientes
        grupos={agruparPorDia(pendientes, "asc")}
        materias={[]}
        categorias={CATEGORIAS_DEMO}
        onToggle={nada}
        onSeleccionar={nada}
      />
    </SeccionPendientes>
  );

  return (
    <CarruselCapturas
      capturas={[
        {
          titulo: "Tu semana y tus pendientes",
          ruta: "/personal",
          contenido: (
            <div className={PAGINA}>
              {encabezado}
              <Seccion titulo="Esta semana">
                <CalendarioSemana pendientes={pendientes} diaInicial={fechaHoy()} />
              </Seccion>
              {lista}
            </div>
          ),
        },
        {
          titulo: "Categorías a tu medida",
          ruta: "/personal",
          contenido: (
            <div className={PAGINA}>
              {encabezado}
              <div className="border border-gray-200 rounded-xl bg-white p-4">
                <GestorCategorias categorias={CATEGORIAS_DEMO} onAgregar={nada} onEliminar={nada} />
              </div>
              {lista}
            </div>
          ),
        },
      ]}
    />
  );
}
