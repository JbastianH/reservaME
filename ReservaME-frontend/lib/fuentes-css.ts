export function obtenerVariableFuente(fontFamily?: string | null) {
  switch (fontFamily) {
    case "Montserrat":
      return "var(--font-montserrat)";
    case "Poppins":
      return "var(--font-poppins)";
    case "Oswald":
      return "var(--font-oswald)";
    case "Bebas Neue":
      return "var(--font-bebas-neue)";
    case "Anton":
      return "var(--font-anton)";
    case "Black Ops One":
      return "var(--font-black-ops-one)";
    case "Bungee":
      return "var(--font-bungee)";

    case "Jim Nightshade":
      return "var(--font-jim-nightshade)";
    case "Pirata One":
      return "var(--font-pirata-one)";
    case "Metal Mania":
      return "var(--font-metal-mania)";
    case "UnifrakturMaguntia":
      return "var(--font-unifraktur)";
    case "Grenze Gotisch":
      return "var(--font-grenze-gotisch)";

    case "Playfair Display":
      return "var(--font-playfair-display)";
    case "Lora":
      return "var(--font-lora)";
    case "Cinzel":
      return "var(--font-cinzel)";
    case "Cormorant Garamond":
      return "var(--font-cormorant-garamond)";

    case "Pacifico":
      return "var(--font-pacifico)";
    case "Dancing Script":
      return "var(--font-dancing-script)";
    case "Great Vibes":
      return "var(--font-great-vibes)";

    case "Raleway":
      return "var(--font-raleway)";
    case "Roboto":
      return "var(--font-roboto)";
    case "Inter":
    default:
      return "var(--font-inter)";
  }
}