"use client";
import { cn } from "@/lib/utils";

export interface OpcionFiltro {
  id: string | null;
  label: string;
  color?: string;
}

interface Props {
  opciones: OpcionFiltro[];
  valor: string | null;
  onChange: (id: string | null) => void;
}

export default function FiltroChips({ opciones, valor, onChange }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {opciones.map((op) => {
        const activo = valor === op.id;
        return (
          <button
            key={op.id ?? "__todo__"}
            type="button"
            onClick={() => onChange(op.id)}
            className={cn(
              "flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
              activo
                ? "border-transparent text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            )}
            style={
              activo
                ? { backgroundColor: op.color ?? "#1e3a5f", borderColor: op.color ?? "#1e3a5f" }
                : undefined
            }
          >
            {op.color && !activo && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: op.color }} />
            )}
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
