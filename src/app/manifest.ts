import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ContaLeve",
    short_name: "ContaLeve",
    description: "Suas contas, sem peso. Controle financeiro da família.",
    start_url: "/",
    display: "browser",
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
