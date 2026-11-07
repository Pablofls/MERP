"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Prenda } from "@/lib/types";
import type { DatosPrenda } from "../hooks/usePrendas";
import ImagenPrenda from "./ImagenPrenda";
import SelectorCategoria from "./SelectorCategoria";

interface Props {
  prenda: Prenda | null;
  onClose: () => void;
  onGuardar: (id: string, datos: DatosPrenda) => Promise<boolean>;
  onEliminar: (prenda: Prenda) => Promise<boolean>;
}

export default function DetallePrenda({ prenda, onClose, onGuardar, onEliminar }: Props) {
  return (
    <Modal open={!!prenda} onClose={onClose} title="Prenda">
      {prenda && <Form key={prenda.id} prenda={prenda} onClose={onClose} onGuardar={onGuardar} onEliminar={onEliminar} />}
    </Modal>
  );
}

function Form({ prenda, onClose, onGuardar, onEliminar }: Omit<Props, "prenda"> & { prenda: Prenda }) {
  const [categoria, setCategoria] = useState<string | null>(prenda.categoria);
  const [nombre, setNombre] = useState(prenda.nombre ?? "");
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambio = categoria !== prenda.categoria || nombre.trim() !== (prenda.nombre ?? "");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!categoria || !cambio) return;
    setOcupado(true);
    setError(null);
    const ok = await onGuardar(prenda.id, { categoria, nombre });
    setOcupado(false);
    if (ok) onClose();
    else setError("No se pudieron guardar los cambios. Intenta de nuevo.");
  }

  async function eliminar() {
    setOcupado(true);
    const ok = await onEliminar(prenda);
    setOcupado(false);
    if (ok) onClose();
    else setError("No se pudo eliminar la prenda. Intenta de nuevo.");
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="h-64 rounded-xl bg-stone-100 flex items-center justify-center p-5">
        <ImagenPrenda prenda={prenda} className="w-full h-full" />
      </div>
      <SelectorCategoria valor={categoria} onChange={setCategoria} />
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre (opcional)</label>
        <input
          type="text"
          value={nombre}
          maxLength={80}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="ej. Playera blanca básica"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
      </div>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>
        <button
          type="submit"
          disabled={!categoria || !cambio || ocupado}
          className="flex-1 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-40 transition-colors"
        >
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <div className="border-t border-gray-100 pt-3">
        {confirmar ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 flex-1">¿Eliminar esta prenda? No se puede deshacer.</span>
            <button type="button" onClick={() => setConfirmar(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors">
              No
            </button>
            <button
              type="button"
              onClick={eliminar}
              disabled={ocupado}
              className="text-xs text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 px-3 py-1 rounded-md transition-colors"
            >
              Sí, eliminar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            className="w-full text-xs text-red-400 hover:text-red-600 py-1 transition-colors text-center"
          >
            Eliminar prenda
          </button>
        )}
      </div>
    </form>
  );
}
