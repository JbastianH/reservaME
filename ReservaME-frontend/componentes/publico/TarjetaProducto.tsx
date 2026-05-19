"use client";

import Image from "next/image";

type Props = {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagenUrl?: string | null;
  stock: number;
  onClick?: () => void;
};

export default function TarjetaProducto({ nombre, descripcion, precio, imagenUrl, stock, onClick }: Props) {
  const precioCLP = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(precio);

  return (
    <div 
      onClick={onClick}
      /* 
        Ajustes Mobile:
        - active:scale-[0.98] comprime la tarjeta al tocar.
        - active:border-fuchsia-500 y active:shadow-... encienden el neón de inmediato.
        - md:hover:-translate-y-1 asegura que el salto hacia arriba solo pase en PC.
        - Cambié duration-500 a duration-300 para que la respuesta al tacto sea más rápida.
      */
      className="group mx-auto flex w-full max-w-[300px] cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-neutral-800 bg-[#0a0a0a] shadow-sm transition-all duration-300 md:hover:-translate-y-1 hover:border-fuchsia-500 hover:shadow-[0_0_25px_rgba(217,70,239,0.3)] active:scale-[0.98] active:border-fuchsia-500 active:shadow-[0_0_25px_rgba(217,70,239,0.4)]"
    >
      <div className="relative h-48 w-full shrink-0 border-b-2 border-neutral-800 bg-gradient-to-b from-neutral-900 to-[#0a0a0a] p-4 transition-colors duration-300 group-hover:border-neutral-700 group-active:border-neutral-700">
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={`Imagen de ${nombre}`}
            fill
            /* group-active:scale-105 le da un ligero impulso a la imagen al presionar */
            className="object-contain p-4 transition duration-300 group-hover:scale-110 group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs italic text-neutral-600">
            Sin imagen
          </div>
        )}
        
        {stock <= 5 && (
          <div className="caprasimo-regular absolute left-3 top-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            Bajo Stock
          </div>
        )}
      </div>

      <div className="flex flex-col p-5 flex-grow justify-between">
        <div className="text-left mb-4">
          <h3 className="milonga-regular text-lg font-bold text-white leading-tight line-clamp-2 transition-colors duration-300 group-hover:text-fuchsia-50 group-active:text-fuchsia-50">
            {nombre}
          </h3>
          <p className="milonga-regular mb-1 line-clamp-1 text-[11px] text-violet-400 uppercase tracking-widest font-semibold transition-colors duration-300 group-hover:text-violet-300 group-active:text-violet-300">
            {descripcion || "Producto Premium"}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="caprasimo-regular text-2xl font-black text-white">
            {precioCLP}
          </span>
          {/* 
            La etiqueta de stock ahora se comporta como botón: 
            group-active:scale-95 la hunde ligeramente e intensifica el brillo 
          */}
          <span className="caprasimo-regular bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide shadow-[0_0_10px_rgba(139,92,246,0.4)] transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(217,70,239,0.6)] group-active:shadow-[0_0_20px_rgba(217,70,239,0.8)] group-active:scale-95">
            Stock: {stock}
          </span>
        </div>
      </div>
    </div>
  );
}