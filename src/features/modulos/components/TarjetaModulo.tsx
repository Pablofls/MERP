"use client";
import Link from "next/link";
import type { Modulo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { REGISTRO_MODULOS } from "../registro";
import { FICHAS } from "../fichas";

interface Props {
  modulo: Modulo;
  activo: boolean;
  deshabilitado?: boolean;
  onCambiar: (activar: boolean) => void;
}

export default function TarjetaModulo({ modulo, activo, deshabilitado, onCambiar }: Props) {
  const ui = REGISTRO_MODULOS[modulo.clave];
  const ficha = FICHAS[modulo.clave];
  const hrefFicha = `/modulos/${modulo.clave}`;

  return (
    <div
      className={cn(
        "bg-white border rounded-xl p-4 flex flex-col gap-3 transition-colors",
        activo ? "border-gray-200" : "border-gray-100 bg-gray-50/60",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícono, nombre y descripción llevan a la ficha */}
        <Link href={hrefFicha} className="flex items-start gap-3 flex-1 min-w-0 group">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-opacity",
              !activo && "opacity-50",
            )}
            style={{ backgroundColor: ficha?.color ?? "#1e3a8a" }}
          >
            {ui?.icono(true)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-semibold group-hover:underline", activo ? "text-gray-900" : "text-gray-500")}>
              {modulo.nombre}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ficha?.subtitulo ?? modulo.descripcion}</p>
          </div>
        </Link>
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
        <div className="flex items-center gap-3">
          <Link href={hrefFicha} className="font-medium text-gray-500 hover:text-gray-800 transition-colors">
            Ver detalles
          </Link>
          {activo && ui && (
            <Link href={ui.ruta} className="font-medium text-blue-900 hover:text-blue-700 transition-colors">
              Abrir →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
