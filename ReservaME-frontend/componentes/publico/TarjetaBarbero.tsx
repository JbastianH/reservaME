"use client";

import Image from "next/image";
import Link from "next/link";
import { useLoading } from "@/context/LoadingProvider";

type Props = {
  name: string;
  slug: string;
  bio?: string | null;
  photoUrl?: string | null;
  href?: string;
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

export default function TarjetaBarbero({ name, slug, bio, photoUrl, href }: Props) {
  const { startLoading } = useLoading();
  const link = href ?? `/barberos/${slug}`;
  const imgSrc = safeImageSrc(photoUrl);
  const initialsText = initials(name);

  const handleClick = () => {
    startLoading();
  };

  return (
    <Link
      href={link}
      onClick={handleClick}
      /* 
        Añadidos los estados "active:" para celulares.
        active:scale-[0.98] hace que la tarjeta se "hunda" levemente al tocarla.
        active:border-black activa el borde negro al presionar.
      */
      className="group relative mx-auto flex aspect-square w-full max-w-[320px] flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-neutral-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-black active:scale-[0.98] active:border-black active:shadow-sm md:hover:-translate-y-2 md:hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
    >
      {/* Avatar - Ahora reacciona tanto al hover (PC) como al tap (Celular) */}
      <div className="relative z-10 mb-4 h-36 w-36 shrink-0 overflow-hidden rounded-full border-[4px] border-white bg-neutral-50 shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:border-black group-active:scale-95 group-active:border-black md:group-hover:shadow-[0_10px_25px_rgba(0,0,0,0.15)]">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={name}
            width={144}
            height={144}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-300 transition-colors duration-300 group-hover:text-black group-active:text-black">
            {initialsText || "B"}
          </div>
        )}
      </div>

      <div className="relative z-10 text-center">
        <h3 className="caprasimo-regular text-2xl leading-tight font-bold text-black">{name}</h3>
        <p className="caprasimo-regular mt-1 line-clamp-1 px-2 text-[11px] font-semibold tracking-widest text-neutral-400 uppercase transition-colors duration-300 group-hover:text-neutral-800 group-active:text-neutral-800">
          {bio || "Barbero profesional"}
        </p>
      </div>

      <div className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-xs font-bold tracking-widest text-white uppercase shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-all duration-300 group-hover:bg-neutral-800 group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)] group-active:scale-95 group-active:bg-black group-active:shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        Ver perfil{" "}
        <span className="transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}
