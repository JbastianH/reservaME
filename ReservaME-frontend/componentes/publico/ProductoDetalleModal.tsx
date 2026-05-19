"use client";

import Image from "next/image";

interface Props {
  producto: any; // O usa tu interface de Producto
  onClose: () => void;
}

export default function ProductoDetalleModal({ producto, onClose }: Props) {
  if (!producto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fondo desenfocado */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Tarjeta Detalle */}
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl md:flex md:max-h-none md:overflow-visible">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-md hover:bg-white md:-top-4 md:-right-4"
        >
          ✕
        </button>

        {/* Lado Izquierdo: Imagen */}
        <div className="relative h-72 w-full bg-neutral-50 md:h-auto md:w-1/2 md:rounded-l-3xl">
          <img
            src={producto.imagenUrl || "/placeholder-prod.png"}
            alt={producto.nombre}
            className="h-full w-full object-contain p-6"
          />
        </div>

        {/* Lado Derecho: Info */}
        <div className="flex flex-col p-8 md:w-1/2">
          <div className="space-y-1">
            <h2 className="brand-title text-4xl leading-tight font-black text-black uppercase">
              {producto.nombre}
            </h2>
            <p className="brand-title mt-2 text-2xl font-medium text-neutral-900">
              ${Number(producto.precio).toLocaleString("es-CL")}
            </p>
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-6">
            <h3 className="brand-title text-[20px] leading-tight font-black text-black uppercase">
              Descripción
            </h3>
            <div className="custom-scrollbar max-h-40 overflow-y-auto pr-2">
              <p className="text-sm leading-relaxed text-neutral-600">
                {producto.descripcion || "Sin descripción disponible."}
              </p>
            </div>
          </div>

          {/* Specs */}
          <div className="mt-auto flex gap-3 pt-8">
            <div className="flex-1 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
              <p className="brand-title text-[15px] font-bold tracking-widest text-emerald-600/70 uppercase">
                Estado
              </p>
              <p className="brand-title text-sm font-bold text-emerald-700">Disponible</p>
            </div>
            <div className="flex-1 rounded-2xl border border-neutral-100 bg-neutral-50 p-3 text-center">
              <p className="brand-title text-[15px] font-bold text-neutral-400 uppercase">Stock</p>
              <p className="brand-title text-sm font-bold text-black">{producto.stock} unidades </p>
            </div>
            <button
              onClick={onClose}
              className="brand-title flex-[2] rounded-4xl bg-black py-4 text-lg font-bold text-white transition-colors hover:bg-neutral-800"
            >
              CERRAR DETALLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
