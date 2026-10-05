"use client";
import type { VistaPendientes } from "@/features/home/hooks/useVistaPendientes";
import { useHotkey } from "@/lib/hooks/useHotkey";

interface Props {
  vista: VistaPendientes;
  onToggle: () => void;
}

export default function BotonVista({ vista, onToggle }: Props) {
  const hotkeyRef = useHotkey<HTMLButtonElement>("Vista");
  return (
    <button
      ref={hotkeyRef}
      onClick={onToggle}
      title={vista === "timeline" ? "Ver como lista" : "Ver como linea del tiempo"}
      className="flex items-center gap-1 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md px-1.5 py-1 transition-colors"
    >
      {vista === "timeline" ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
          <circle cx="7.5" cy="12" r="2" />
          <circle cx="16.5" cy="12" r="2" />
        </svg>
      )}
    </button>
  );
}
