"use client";
import FiltroChips from "@/components/ui/FiltroChips";
import GridPrendas from "@/features/closet/components/GridPrendas";
import LienzoOutfit from "@/features/closet/components/LienzoOutfit";
import Recortador from "@/features/closet/components/Recortador";
import AjusteTamano from "@/features/closet/components/AjusteTamano";
import { IconoShuffle } from "@/features/closet/components/GeneradorOutfit";
import { GRUPOS, type ClaveGrupo } from "@/features/closet/lib/catalogo";
import type { Outfit } from "@/features/closet/lib/generarOutfit";
import CarruselCapturas from "../../components/CarruselCapturas";
import { Encabezado, nada } from "../Pantalla";
import { CONTORNO_DEMO, FOTO_RECORTE_DEMO, OUTFIT_CAPAS_DEMO, OUTFIT_DEMO, PRENDAS_DEMO } from "../demoCloset";

// Mismo contenedor y columnas que src/app/closet/page.tsx en escritorio
const PAGINA = "max-w-5xl mx-auto px-4 pt-6 pb-6 space-y-4";
const FILTROS = [{ id: null, label: "Todo" }, ...GRUPOS.map((g) => ({ id: g.clave, label: g.nombre }))];

function PaginaCloset({ grupo, outfit, fijas }: { grupo: ClaveGrupo | null; outfit: Outfit; fijas?: Set<string> }) {
  return (
    <div className={PAGINA}>
      <Encabezado titulo="Closet" detalle={`${PRENDAS_DEMO.length} prendas`} accion="agregar" />
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        <section className="space-y-4 min-w-0">
          <FiltroChips opciones={FILTROS} valor={grupo} onChange={nada} />
          <GridPrendas prendas={PRENDAS_DEMO} grupo={grupo} onSeleccionar={nada} />
        </section>
        <aside className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outfit</h2>
          <LienzoOutfit outfit={outfit} fijas={fijas} onAlternarFija={nada} />
          <span className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white text-sm font-semibold py-3 rounded-full">
            <IconoShuffle className="w-4 h-4" />
            Generar outfit
          </span>
        </aside>
      </div>
    </div>
  );
}

/** Página del closet con el modal de agregar prenda encima. */
function ConModal({ ayuda, children }: { ayuda: string; children: React.ReactNode }) {
  return (
    <div className="relative h-full">
      <PaginaCloset grupo={null} outfit={OUTFIT_DEMO} />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl w-[640px]">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Agregar prenda</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-gray-500 text-center">{ayuda}</p>
            {children}
            <div className="flex gap-2 pt-1">
              <span className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 text-center">Atrás</span>
              <span className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium text-center">Siguiente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const JEANS = PRENDAS_DEMO.find((p) => p.id === "demo-jeans")!;

export default function CapturasCloset() {
  return (
    <CarruselCapturas
      capturas={[
        { titulo: "Tu closet y un outfit al azar", ruta: "/closet", contenido: <PaginaCloset grupo={null} outfit={OUTFIT_DEMO} /> },
        {
          titulo: "Recorta cada prenda a mano",
          ruta: "/closet",
          contenido: (
            <ConModal ayuda="Arrastra los puntos para ajustar. Arrastra el punto medio de un lado para agregar otro.">
              <Recortador src={FOTO_RECORTE_DEMO} inicial={CONTORNO_DEMO} altoMax="380px" vistaPrevia />
            </ConModal>
          ),
        },
        {
          titulo: "Ajusta su tamaño a la silueta",
          ruta: "/closet",
          contenido: (
            <ConModal ayuda="Ajusta tu prenda a la silueta de referencia: arrástrala y cambia su tamaño.">
              <AjusteTamano
                categoria="pantalones"
                src={JEANS.imagenUrl}
                ancho={JEANS.ancho}
                alto={JEANS.alto}
                altoCm={JEANS.altoCm * 0.92}
                altoMax="400px"
                soloLectura
              />
            </ConModal>
          ),
        },
        {
          titulo: "Tops por capas y candados",
          ruta: "/closet",
          contenido: <PaginaCloset grupo="tops" outfit={OUTFIT_CAPAS_DEMO} fijas={new Set(["demo-chamarra"])} />,
        },
      ]}
    />
  );
}
