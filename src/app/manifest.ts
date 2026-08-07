import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas Personales",
    short_name: "Finanzas",
    description: "Gastos del mes, plan mensual y catálogo de precios.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#10794f",
    lang: "es",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
