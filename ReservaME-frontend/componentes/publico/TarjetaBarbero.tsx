"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLoading } from "@/context/LoadingProvider";

type Props = {
  name: string;
  slug: string;
  bio?: string | null;
  photoUrl?: string | null;
  href?: string;
  secondaryColor?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function safeImageSrc(src?: string | null) {
  const s = (src ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return null;
}

function hexToRgba(hex: string, opacity: number) {
  const cleanHex = hex.replace("#", "");

  if (cleanHex.length !== 6) {
    return `rgba(0,0,0,${opacity})`;
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function TarjetaBarbero({
  name,
  slug,
  bio,
  photoUrl,
  href,
  secondaryColor = "#000000",
}: Props) {
  const { startLoading } = useLoading();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const link = href ?? `/barberos/${slug}`;
  const imgSrc = safeImageSrc(photoUrl);
  const initialsText = initials(name);

  const colorSuave = hexToRgba(secondaryColor, 0.14);
  const colorSombra = hexToRgba(secondaryColor, pressed ? 0.45 : 0.28);

  const activo = hovered || pressed;

  const handleClick = () => {
    startLoading();
  };

  return (
    <Link
      href={link}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="group relative mx-auto flex aspect-square w-full max-w-[320px] flex-col items-center justify-center overflow-hidden rounded-3xl border-2 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 active:scale-[0.98] md:hover:-translate-y-2"
      style={{
        borderColor: activo ? secondaryColor : "#f5f5f5",
        boxShadow: activo
          ? `0 20px 40px ${colorSombra}`
          : "0 4px 20px rgba(0,0,0,0.03)",
      }}
    >
      {/* Brillo decorativo según color secundario */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"
        style={{ backgroundColor: colorSuave }}
      />

      {/* Avatar */}
      <div
        className="relative z-10 mb-4 h-36 w-36 shrink-0 overflow-hidden rounded-full border-[4px] bg-neutral-50 shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all duration-300 group-active:scale-95 md:group-hover:shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
        style={{
          borderColor: activo ? secondaryColor : "#ffffff",
        }}
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={name}
            width={144}
            height={144}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-3xl font-bold transition-colors duration-300"
            style={{
              color: activo ? secondaryColor : "#d4d4d4",
            }}
          >
            {initialsText || "B"}
          </div>
        )}
      </div>

      <div className="relative z-10 text-center">
        <h3 className="caprasimo-regular text-2xl font-bold leading-tight text-black">
          {name}
        </h3>

        <p
          className="caprasimo-regular mt-1 line-clamp-1 px-2 text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300"
          style={{
            color: activo ? secondaryColor : "#a3a3a3",
          }}
        >
          {bio || "Barbero profesional"}
        </p>
      </div>

      <div
        className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 group-active:scale-95"
        style={{
          backgroundColor: activo ? secondaryColor : "#000000",
          boxShadow: activo
            ? `0 8px 24px ${colorSombra}`
            : "0 4px 14px rgba(0,0,0,0.25)",
        }}
      >
        Ver perfil{" "}
        <span className="transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}