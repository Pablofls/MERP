"use client";
import { cn } from "@/lib/utils";
import { useHotkey } from "@/lib/hooks/useHotkey";

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
  /** Habilita atajos de teclado (Alt + letra) sobre estos chips */
  atajos?: boolean;
}

export default function FiltroChips({ opciones, valor, onChange, atajos = false }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pt-2 pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {opciones.map((op) => (
        <Chip
          key={op.id ?? "__todo__"}
          opcion={op}
          activo={valor === op.id}
          onChange={onChange}
          atajos={atajos}
        />
      ))}
    </div>
  );
}

function Chip({
  opcion,
  activo,
  onChange,
  atajos,
}: {
  opcion: OpcionFiltro;
  activo: boolean;
  onChange: (id: string | null) => void;
  atajos: boolean;
}) {
  const hotkeyRef = useHotkey<HTMLButtonElement>(opcion.label, { disabled: !atajos });

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={hotkeyRef}
        type="button"
        onClick={() => onChange(opcion.id)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
          activo
            ? "border-transparent text-white"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
        )}
        style={
          activo
            ? { backgroundColor: opcion.color ?? "#1e3a5f", borderColor: opcion.color ?? "#1e3a5f" }
            : undefined
        }
      >
        {opcion.color && !activo && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opcion.color }} />
        )}
        {opcion.label}
      </button>
      {opcion.count !== undefined && opcion.count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none pointer-events-none">
          {opcion.count > 99 ? "99+" : opcion.count}
        </span>
      )}
    </div>
  );
}
