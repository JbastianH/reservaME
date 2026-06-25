import Link from "next/link";

type FooterProps = {
  tenantName?: string;
  footerColor?: string;
  instagramUrl?: string | null;
};

function getTextColorForBackground(backgroundColor: string) {
  const hex = backgroundColor.replace("#", "");

  if (hex.length !== 6) {
    return "#ffffff";
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#111827" : "#ffffff";
}

export default function Footer({
  tenantName = "ReservaME",
  footerColor = "#000000",
  instagramUrl,
}: FooterProps) {
  const year = new Date().getFullYear();
  const textColor = getTextColorForBackground(footerColor);

  return (
    <footer
      className="w-full border-t"
      style={{
        backgroundColor: footerColor,
        borderColor: textColor === "#ffffff" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
        <div
          className="text-center text-sm sm:text-left"
          style={{
            color: textColor === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(17,24,39,0.75)",
          }}
        >
          © {year} {tenantName}. Todos los derechos reservados.
        </div>

        <div className="flex items-center gap-4">
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
      </div>
    </footer>
  );
}
