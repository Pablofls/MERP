"use client";
import { cn } from "@/lib/utils";

export interface OpcionFiltro {
  id: string | null;
  label: string;
  color?: string;
  count?: number;
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
          <div key={op.id ?? "__todo__"} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => onChange(op.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
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
            {op.count !== undefined && op.count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none pointer-events-none">
                {op.count > 99 ? "99+" : op.count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
