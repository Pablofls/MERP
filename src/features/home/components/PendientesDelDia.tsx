"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Pendiente, Materia, CategoriaPersonal } from "@/lib/types";
import ListaPendientes from "./ListaPendientes";
const DetallePendiente = dynamic(() => import("./DetallePendiente"), { ssr: false });

interface Props {
  fecha: string;
  pendientes: Pendiente[]; // ya filtrados al día
  materias: Materia[];
  categorias: CategoriaPersonal[];
  onToggle: (id: string) => void;
  onEditar: (id: string, datos: Partial<Pick<Pendiente, "titulo" | "descripcion" | "fechaLimite" | "materiaId">>) => void;
  onEliminar: (id: string) => void;
}

export default function PendientesDelDia({ fecha, pendientes, materias, categorias, onToggle, onEditar, onEliminar }: Props) {
  const [detalle, setDetalle] = useState<Pendiente | null>(null);

  return (
    <section>
      {pendientes.length === 0 ? (
        <p className="text-xs text-gray-400">Sin pendientes para este día</p>
      ) : (
        <ListaPendientes
          grupos={[{ label: `Pendientes del día · ${pendientes.length}`, fecha, items: pendientes }]}
          materias={materias}
          categorias={categorias}
          onToggle={onToggle}
          onSeleccionar={setDetalle}
        />
      )}
      <DetallePendiente
        pendiente={detalle}
        materias={materias}
        categorias={categorias}
        onClose={() => setDetalle(null)}
        onToggle={(id) => { onToggle(id); setDetalle(null); }}
        onEditar={onEditar}
        onEliminar={onEliminar}
      />
    </section>
  );
}
