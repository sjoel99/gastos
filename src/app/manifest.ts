import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gastos",
    short_name: "Gastos",
    description: "Controle de gastos mensais da família",
    start_url: "/matriz",
    display: "standalone",
    background_color: "#fbfaff",
    theme_color: "#5d2ca8",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
