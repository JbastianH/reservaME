"use client";

import Link from "next/link";
import Image from "next/image";

type HeaderProps = {
  tenantName?: string;
  logoUrl?: string | null;
  headerColor?: string;
  instagramUrl?: string | null;
};

function getReadableTextColor(backgroundColor: string) {
  const hex = backgroundColor.replace("#", "");

  if (hex.length !== 6) return "#ffffff";

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 160 ? "#111111" : "#ffffff";
}

export default function Header({
  tenantName = "ReservaME",
  logoUrl,
  headerColor = "#ffffff",
  instagramUrl,
}: HeaderProps) {
  const textColor = getReadableTextColor(headerColor);

  const logoSrc =
    logoUrl ||
    "https://res.cloudinary.com/dllykgnb0/image/upload/v1780457196/Logo_ReservaME_sin_fondo_oltrvn.png";

  return (
    <header
      className="w-full border-b border-white/10"
      style={{ backgroundColor: headerColor, color: textColor }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-16 w-48 items-center justify-start sm:h-[72px] sm:w-64">
  <Image
    src={logoSrc}
    alt={`${tenantName} Logo`}
    width={260}
    height={100}
    className="max-h-full w-auto max-w-full object-contain"
    priority
  />
</div>
        </Link>

        {instagramUrl ? (
          <Link
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(217,70,239,0.6)] active:scale-95 active:shadow-[0_0_20px_rgba(217,70,239,0.8)]"
            aria-label={`Ir al Instagram de ${tenantName}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:scale-110"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
