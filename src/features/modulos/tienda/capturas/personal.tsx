"use client";
import ListaPendientes from "@/features/home/components/ListaPendientes";
import CalendarioSemana from "@/features/personal/components/CalendarioSemana";
import GestorCategorias from "@/features/personal/components/GestorCategorias";
import { agruparPorDia } from "@/features/home/lib/agrupar";
import { fechaHoy } from "@/lib/utils";
import CarruselCapturas from "../../components/CarruselCapturas";
import { Encabezado, Seccion, nada } from "../Pantalla";
import { CATEGORIAS_DEMO, pendientesPersonalesDemo } from "../demo";

export default function CapturasPersonal() {
  const pendientes = pendientesPersonalesDemo();
  const encabezado = (
    <Encabezado titulo="Personal" detalle={`${pendientes.length} pendientes · ${CATEGORIAS_DEMO.length} categorías`} />
  );
  const lista = (items = pendientes) => (
    <ListaPendientes
      grupos={agruparPorDia(items, "asc")}
      materias={[]}
      categorias={CATEGORIAS_DEMO}
      onToggle={nada}
      onSeleccionar={nada}
    />
  );

  return (
    <CarruselCapturas
      capturas={[
        {
          titulo: "Pendientes por categoría",
          contenido: (
            <>
              {encabezado}
              <Seccion titulo="Pendientes">{lista()}</Seccion>
            </>
          ),
        },
        {
          titulo: "Tu semana",
          contenido: (
            <>
              {encabezado}
              <Seccion titulo="Esta semana">
                <CalendarioSemana pendientes={pendientes} diaInicial={fechaHoy()} />
              </Seccion>
            </>
          ),
        },
        {
          titulo: "Categorías a tu medida",
          contenido: (
            <>
              {encabezado}
              <div className="border border-gray-200 rounded-xl bg-white p-4">
                <GestorCategorias categorias={CATEGORIAS_DEMO} onAgregar={nada} onEliminar={nada} />
              </div>
              <Seccion titulo="Fitness y lectura">
                {lista(pendientes.filter((p) => p.categoriaPersonalId === "demo-cat-fitness" || p.categoriaPersonalId === "demo-cat-lectura"))}
              </Seccion>
            </>
          ),
        },
      ]}
    />
  );
}
