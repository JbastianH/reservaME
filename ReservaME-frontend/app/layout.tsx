import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Jim_Nightshade } from "next/font/google";
import { LoadingProvider } from "@/context/LoadingProvider";
import PageSkeleton from "@/componentes/ui/PageSkeleton";
import { SesionProvider } from "@/context/SesionProvider";
import PwaManifest from "@/componentes/PwaManifest";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const jim_nightshade = Jim_Nightshade({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jim-nightshade",
});

// Configuración del Viewport (PWA)
// Define el color de la barra del celular y bloquea el zoom para que se sienta nativa
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Metadata con el enlace al manifest
export const metadata: Metadata = {
  title: "Black & White Studio",
  description: "Barbería profesional - Black & White Studio",
  icons: {
    apple: "/img/icon_x192.png", // Icono para iPhone
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <PwaManifest />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jim_nightshade.variable} flex min-h-screen flex-col antialiased`}
      >
        <LoadingProvider>
          <SesionProvider>
            <PageSkeleton />
            {children}
          </SesionProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}