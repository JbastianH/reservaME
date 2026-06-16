"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagenUrl?: string | null;
  stock: number;
  secondaryColor?: string;
  onClick?: () => void;
};

function hexToRgba(hex: string, opacity: number) {
  const cleanHex = hex.replace("#", "");

  if (cleanHex.length !== 6) {
    return `rgba(255,255,255,${opacity})`;
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function TarjetaProducto({
  nombre,
  descripcion,
  precio,
  imagenUrl,
  stock,
  secondaryColor = "#d946ef",
  onClick,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const precioCLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(precio);

  const brilloHover = hexToRgba(secondaryColor, pressed ? 0.45 : 0.32);
  const brilloBadge = hexToRgba(secondaryColor, pressed ? 0.75 : 0.45);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="group mx-auto flex w-full max-w-[300px] cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-[#0a0a0a] shadow-sm transition-all duration-300 md:hover:-translate-y-1 active:scale-[0.98]"
      style={{
        borderColor: hovered || pressed ? secondaryColor : "#262626",
        boxShadow:
          hovered || pressed
            ? `0 0 25px ${brilloHover}`
            : "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="relative h-48 w-full shrink-0 border-b-2 bg-gradient-to-b from-neutral-900 to-[#0a0a0a] p-4 transition-colors duration-300"
        style={{
          borderColor: hovered || pressed ? hexToRgba(secondaryColor, 0.35) : "#262626",
        }}
      >
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={`Imagen de ${nombre}`}
            fill
            className="object-contain p-4 transition duration-300 group-hover:scale-110 group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs italic text-neutral-600">
            Sin imagen
          </div>
        )}

        {stock <= 5 && (
          <div className="caprasimo-regular absolute left-3 top-3 rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            Bajo Stock
          </div>
        )}
      </div>

      <div className="flex flex-grow flex-col justify-between p-5">
        <div className="mb-4 text-left">
          <h3 className="milonga-regular line-clamp-2 text-lg font-bold leading-tight text-white transition-colors duration-300">
            {nombre}
          </h3>

          <p
            className="milonga-regular mb-1 line-clamp-1 text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300"
            style={{
              color: hovered || pressed ? secondaryColor : hexToRgba(secondaryColor, 0.8),
            }}
          >
            {descripcion || "Producto Premium"}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="caprasimo-regular text-2xl font-black text-white">
            {precioCLP}
          </span>

          <span
            className="caprasimo-regular rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition-all duration-300 group-active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${secondaryColor}, ${hexToRgba(
                secondaryColor,
                0.7,
              )})`,
              boxShadow: `0 0 ${hovered || pressed ? "16px" : "10px"} ${brilloBadge}`,
            }}
          >
            Stock: {stock}
          </span>
        </div>
      </div>
    </div>
  );
}