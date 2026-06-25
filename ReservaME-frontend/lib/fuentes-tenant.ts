export type FuenteTenant = {
  label: string;
  value: string;
  descripcion: string;
};

export const FUENTES_TENANT: FuenteTenant[] = [
  // Modernas / limpias
  {
    label: "Inter",
    value: "Inter",
    descripcion: "Moderna, limpia y profesional.",
  },
  {
    label: "Poppins",
    value: "Poppins",
    descripcion: "Redondeada, juvenil y amigable.",
  },
  {
    label: "Montserrat",
    value: "Montserrat",
    descripcion: "Elegante, moderna y fuerte.",
  },
  {
    label: "Raleway",
    value: "Raleway",
    descripcion: "Fina, moderna y minimalista.",
  },
  {
    label: "Roboto",
    value: "Roboto",
    descripcion: "Simple, legible y neutral.",
  },

  // Urbanas / fuertes
  {
    label: "Oswald",
    value: "Oswald",
    descripcion: "Condensada, urbana y llamativa.",
  },
  {
    label: "Bebas Neue",
    value: "Bebas Neue",
    descripcion: "Grande, fuerte y estilo barbería.",
  },
  {
    label: "Anton",
    value: "Anton",
    descripcion: "Pesada, directa y con mucha presencia.",
  },
  {
    label: "Black Ops One",
    value: "Black Ops One",
    descripcion: "Militar, potente y agresiva.",
  },
  {
    label: "Bungee",
    value: "Bungee",
    descripcion: "Urbana, gruesa y llamativa.",
  },

  // Barbería / gótica / tattoo
  {
    label: "Jim Nightshade",
    value: "Jim Nightshade",
    descripcion: "Gótica, artística y estilo barbería clásica.",
  },
  {
    label: "Pirata One",
    value: "Pirata One",
    descripcion: "Gótica, oscura y con personalidad.",
  },
  {
    label: "Metal Mania",
    value: "Metal Mania",
    descripcion: "Rockera, pesada y alternativa.",
  },
  {
    label: "UnifrakturMaguntia",
    value: "UnifrakturMaguntia",
    descripcion: "Gótica medieval, muy llamativa.",
  },
  {
    label: "Grenze Gotisch",
    value: "Grenze Gotisch",
    descripcion: "Oscura, vintage y dramática.",
  },

  // Elegantes / premium
  {
    label: "Playfair Display",
    value: "Playfair Display",
    descripcion: "Elegante, clásica y premium.",
  },
  {
    label: "Lora",
    value: "Lora",
    descripcion: "Clásica, suave y sofisticada.",
  },
  {
    label: "Cinzel",
    value: "Cinzel",
    descripcion: "Elegante, romana y de lujo.",
  },
  {
    label: "Cormorant Garamond",
    value: "Cormorant Garamond",
    descripcion: "Editorial, fina y sofisticada.",
  },

  // Manuscritas / firma
  {
    label: "Pacifico",
    value: "Pacifico",
    descripcion: "Manuscrita, relajada y retro.",
  },
  {
    label: "Dancing Script",
    value: "Dancing Script",
    descripcion: "Firma elegante y cercana.",
  },
  {
    label: "Great Vibes",
    value: "Great Vibes",
    descripcion: "Caligráfica, elegante y premium.",
  },
];

export const FUENTE_TENANT_DEFAULT = "Inter";