import type { MetadataRoute } from "next";

/** Gör appen installerbar (PWA): helskärm från hemskärmen, utan adressfält. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Min måltid – beställ din mat",
    short_name: "Min måltid",
    description: "Beställ sjukhusmat på surfplattan.",
    lang: "sv",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fbf7f2",
    theme_color: "#2f6b4f",
    icons: [
      { src: "/ikoner/ikon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikoner/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/ikoner/ikon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
