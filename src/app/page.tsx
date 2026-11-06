"use client";
import { useMemo, useState } from "react";
import { usePendientes } from "@/features/home/hooks/usePendientes";
import { useMaterias } from "@/features/escolar/hooks/useMaterias";
import { useClases } from "@/features/escolar/hooks/useClases";
import { useCategorias } from "@/features/personal/hooks/useCategorias";
import { useFechasImportantes } from "@/features/escolar/hooks/useFechasImportantes";
import { useGoogleCalendarMes } from "@/features/google/hooks/useGoogleCalendarMes";
import AgendaHoy from "@/features/home/components/AgendaHoy";
import PendientesHoy from "@/features/home/components/PendientesHoy";
import PendientesDelDia from "@/features/home/components/PendientesDelDia";
import CalendarioMes, { type ConteoPendientes } from "@/features/home/components/CalendarioMes";
import { SkeletonLista } from "@/components/ui/Skeleton";
import { estaEnSieteDias, fechaImportanteAPendiente } from "@/lib/utils";
import { construirAgendaDia, eventosDelDia, fechaDeIso, isoLocal } from "@/features/home/lib/agendaDia";

function primerDiaMes(fecha: string): Date {
  const d = fechaDeIso(fecha);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function HomePage() {
  const { cargando, pendientes, agregar, toggleCompletado, eliminar, editar } = usePendientes();
  const { materias } = useMaterias();
  const { clases } = useClases();
  const { categorias } = useCategorias();
  const { fechas, toggleCompletado: toggleFecha } = useFechasImportantes();

  const hoy = isoLocal(new Date());
  const [fechaSel, setFechaSel] = useState(hoy);
  const [mesRef, setMesRef] = useState(() => primerDiaMes(hoy));
  const { eventos: eventosMes, refetch: refetchCalendario } = useGoogleCalendarMes(mesRef);

  // Fechas importantes dentro de 7 días se muestran como pendientes en la lista general
  const fechasProximas = fechas
    .filter((f) => !f.completado && estaEnSieteDias(f.fecha))
    .map(fechaImportanteAPendiente);
  const todosPendientes = [...pendientes, ...fechasProximas];

  // Para el calendario y el día seleccionado se usan todas las fechas importantes
  const pendientesConFecha = useMemo(
    () => [
      ...pendientes,
      ...fechas.filter((f) => !f.completado).map(fechaImportanteAPendiente),
    ].filter((p) => !p.completado && p.fechaLimite),
    [pendientes, fechas]
  );

  const conteoPendientes = useMemo(() => {
    const mapa = new Map<string, ConteoPendientes>();
    for (const p of pendientesConFecha) {
      const c = mapa.get(p.fechaLimite!) ?? { total: 0, vencidos: 0 };
      c.total++;
      if (p.fechaLimite! < hoy) c.vencidos++;
      mapa.set(p.fechaLimite!, c);
    }
    return mapa;
  }, [pendientesConFecha, hoy]);

  const conteoEventos = useMemo(() => {
    const mapa = new Map<string, number>();
    const dias = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= dias; d++) {
      const fecha = isoLocal(new Date(mesRef.getFullYear(), mesRef.getMonth(), d));
      const { items, todoElDia } = construirAgendaDia(fecha, clases, materias, eventosDelDia(eventosMes, fecha));
      const n = items.length + todoElDia.length;
      if (n > 0) mapa.set(fecha, n);
    }
    return mapa;
  }, [mesRef, clases, materias, eventosMes]);

  const pendientesDia = pendientesConFecha.filter((p) => p.fechaLimite === fechaSel);

  function seleccionarFecha(fecha: string) {
    setFechaSel(fecha);
    const mes = primerDiaMes(fecha);
    if (mes.getTime() !== mesRef.getTime()) setMesRef(mes);
  }

  // Al cambiar de mes se selecciona hoy (si cae en ese mes) o el día 1,
  // para que el panel del día siempre corresponda al mes cargado
  function cambiarMes(mes: Date) {
    setMesRef(mes);
    const mesHoy = primerDiaMes(hoy);
    setFechaSel(mes.getTime() === mesHoy.getTime() ? hoy : isoLocal(mes));
  }

  function handleToggle(id: string) {
    if (fechas.some((f) => f.id === id)) {
      toggleFecha(id);
    } else {
      toggleCompletado(id);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">MERP</h1>
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
        <div className="lg:sticky lg:top-6">
          <CalendarioMes
            mesRef={mesRef}
            onCambiarMes={cambiarMes}
            fechaSel={fechaSel}
            hoy={hoy}
            onSeleccionar={seleccionarFecha}
            conteoEventos={conteoEventos}
            conteoPendientes={conteoPendientes}
          />
        </div>

        <div className="space-y-6 min-w-0">
          <AgendaHoy
            fecha={fechaSel}
            hoy={hoy}
            onCambiarFecha={seleccionarFecha}
            clases={clases}
            materias={materias}
            eventosGoogle={eventosMes}
            onRefetch={refetchCalendario}
          />
          <PendientesDelDia
            fecha={fechaSel}
            pendientes={pendientesDia}
            materias={materias}
            categorias={categorias}
            onToggle={handleToggle}
            onEditar={editar}
            onEliminar={eliminar}
          />
          <div className="border-t border-gray-100" />
          {cargando ? <SkeletonLista /> : (
          <PendientesHoy
            pendientes={todosPendientes}
            materias={materias}
            categorias={categorias}
            onToggle={handleToggle}
            onAgregar={agregar}
            onEditar={editar}
            onEliminar={eliminar}
          />
          )}
        </div>
      </div>
    </div>
  );
}
