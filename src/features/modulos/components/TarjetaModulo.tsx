"use client";
import Link from "next/link";
import type { Modulo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { REGISTRO_MODULOS } from "../registro";

interface Props {
  modulo: Modulo;
  activo: boolean;
  deshabilitado?: boolean;
  onCambiar: (activar: boolean) => void;
}

export default function TarjetaModulo({ modulo, activo, deshabilitado, onCambiar }: Props) {
  const ui = REGISTRO_MODULOS[modulo.clave];

  return (
    <div
      className={cn(
        "bg-white border rounded-xl p-4 flex flex-col gap-3 transition-colors",
        activo ? "border-gray-200" : "border-gray-100 bg-gray-50/60",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
            activo ? "bg-blue-50 text-blue-900" : "bg-gray-100 text-gray-400",
          )}
        >
          {ui?.icono(activo)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", activo ? "text-gray-900" : "text-gray-500")}>{modulo.nombre}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{modulo.descripcion}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-label={`${activo ? "Desactivar" : "Activar"} ${modulo.nombre}`}
          disabled={deshabilitado}
          onClick={() => onCambiar(!activo)}
          className={cn(
            "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            activo ? "bg-blue-900" : "bg-gray-300",
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
              activo ? "translate-x-[18px]" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={activo ? "text-emerald-600 font-medium" : "text-gray-400"}>
          {activo ? "Activo" : "Desactivado · tus datos se conservan"}
        </span>
        {activo && ui && (
          <Link href={ui.ruta} className="font-medium text-blue-900 hover:text-blue-700 transition-colors">
            Abrir →
          </Link>
        )}
      </div>
    </div>
  );
}
