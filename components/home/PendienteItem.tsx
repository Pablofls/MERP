"use client";
import { useState } from "react";
import type { Pendiente } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  pendiente: Pendiente;
  onToggle: (id: string) => void;
  onClick: () => void;
  children?: React.ReactNode;
}

export default function PendienteItem({ pendiente: p, onToggle, onClick, children }: Props) {
  const [completando, setCompletando] = useState(false);

  function handleToggle() {
    if (p.completado) {
      onToggle(p.id);
      return;
    }
    setCompletando(true);
    setTimeout(() => {
      onToggle(p.id);
      setCompletando(false);
    }, 660);
  }

  return (
    <li className={cn("flex items-start gap-3 py-3", completando && "completing-row")}>
      <button
        onClick={handleToggle}
        className={cn(
          "mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
          p.completado
            ? "bg-blue-900 border-blue-900"
            : "border-gray-300 hover:border-blue-700"
        )}
      >
        {p.completado && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>

      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <div className="relative">
          <p className={cn("text-sm", p.completado ? "line-through text-gray-400" : "text-gray-800")}>
            {p.titulo}
          </p>
          {completando && <span className="completing-strike" />}
        </div>
        {children}
      </button>
    </li>
  );
}
