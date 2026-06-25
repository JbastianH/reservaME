"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  producto: any;
  onClose: () => void;
}

export default function ProductoDetalleModal({ producto, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!producto) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [producto]);

  if (!mounted || !producto) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Fondo desenfocado en pantalla completa */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Tarjeta Detalle */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl md:flex md:max-h-none md:overflow-visible">
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-md hover:bg-white md:-top-4 md:-right-4"
          aria-label="Cerrar detalle"
        >
          ✕
        </button>

        {/* Lado Izquierdo: Imagen */}
        <div className="relative h-72 w-full bg-neutral-50 md:h-auto md:w-1/2 md:rounded-l-3xl">
          <Image
            src={producto.imagenUrl || "/placeholder-prod.png"}
            alt={producto.nombre}
            fill
            className="object-contain p-6"
          />
        </div>

        {/* Lado Derecho: Info */}
        <div className="flex flex-col p-8 md:w-1/2">
          <div className="space-y-1">
            <h2 className="caprasimo-regular text-2xl leading-tight font-black text-black uppercase">
              {producto.nombre}
            </h2>

            <p className="caprasimo-regular mt-2 text-2xl font-medium text-neutral-900">
              ${Number(producto.precio).toLocaleString("es-CL")}
            </p>
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-6">
            <h3 className="caprasimo-regular text-[20px] leading-tight font-black text-black uppercase">
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
              <p className="caprasimo-regular text-[10px] font-bold tracking-widest text-emerald-600/70 uppercase">
                Estado
              </p>

              <p className="caprasimo-regular text-sm font-bold text-emerald-700">
                {producto.stock > 0 ? "Disponible" : "Sin stock"}
              </p>
            </div>

            <div className="flex-1 rounded-2xl border border-neutral-100 bg-neutral-50 p-3 text-center">
              <p className="caprasimo-regular text-[10px] font-bold text-neutral-400 uppercase">
                Stock
              </p>

              <p className="caprasimo-regular text-sm font-bold text-black">
                {producto.stock} unidades
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="caprasimo-regular flex-[2] rounded-4xl bg-black py-4 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
            >
              CERRAR DETALLE
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}