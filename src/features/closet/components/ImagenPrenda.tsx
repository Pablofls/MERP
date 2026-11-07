import { cn } from "@/lib/utils";
import type { Prenda } from "@/lib/types";
import { categoria } from "../lib/catalogo";

/** Recorte de la prenda con sombra suave (efecto "sticker"); el fondo transparente deja ver el lienzo. */
export default function ImagenPrenda({ prenda, className }: { prenda: Prenda; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={prenda.imagenUrl}
      width={prenda.ancho}
      height={prenda.alto}
      alt={prenda.nombre ?? categoria(prenda.categoria)?.nombre ?? "Prenda"}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn("object-contain drop-shadow-md select-none", className)}
    />
  );
}
