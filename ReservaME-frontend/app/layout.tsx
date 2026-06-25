import "./globals.css";
import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Jim_Nightshade,
  Inter,
  Montserrat,
  Poppins,
  Oswald,
  Bebas_Neue,
  Anton,
  Playfair_Display,
  Lora,
  Raleway,
  Roboto,
  Black_Ops_One,
  Bungee,
  Pirata_One,
  Metal_Mania,
  UnifrakturMaguntia,
  Grenze_Gotisch,
  Cinzel,
  Cormorant_Garamond,
  Pacifico,
  Dancing_Script,
  Great_Vibes,
} from "next/font/google";
import { LoadingProvider } from "@/context/LoadingProvider";
import PageSkeleton from "@/componentes/ui/PageSkeleton";
import { SesionProvider } from "@/context/SesionProvider";
import PwaManifest from "@/componentes/PwaManifest";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jimNightshade = Jim_Nightshade({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jim-nightshade",
});

/*
  Fuentes disponibles para personalizar cada tenant.
  Se cargan globalmente para que funcionen tanto en la web pública
  como en las vistas previas del panel Super Admin.
*/
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

const blackOpsOne = Black_Ops_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-black-ops-one",
});

const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee",
});

const pirataOne = Pirata_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pirata-one",
});

const metalMania = Metal_Mania({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-metal-mania",
});

const unifraktur = UnifrakturMaguntia({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-unifraktur",
});

const grenzeGotisch = Grenze_Gotisch({
  subsets: ["latin"],
  variable: "--font-grenze-gotisch",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

const fuentesVariables = [
  geistSans.variable,
  geistMono.variable,
  jimNightshade.variable,
  inter.variable,
  montserrat.variable,
  poppins.variable,
  oswald.variable,
  bebasNeue.variable,
  anton.variable,
  playfairDisplay.variable,
  lora.variable,
  raleway.variable,
  roboto.variable,
  blackOpsOne.variable,
  bungee.variable,
  pirataOne.variable,
  metalMania.variable,
  unifraktur.variable,
  grenzeGotisch.variable,
  cinzel.variable,
  cormorantGaramond.variable,
  pacifico.variable,
  dancingScript.variable,
  greatVibes.variable,
].join(" ");

// Configuración del Viewport (PWA)
// Define el color de la barra del celular y bloquea el zoom para que se sienta nativa.
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Metadata con el enlace al manifest.
export const metadata: Metadata = {
  title: "ReservaME",
  description: "Sistema de reservas para barberías",
  icons: {
    icon: "/favicon.ico",
    apple: "/img/icon_x192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fuentesVariables}>
      <head>
        <PwaManifest />
      </head>

      <body className="flex min-h-screen flex-col antialiased">
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
