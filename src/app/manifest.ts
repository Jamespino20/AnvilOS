/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CWL Hardware — POS & Inventory System",
    short_name: "CWL Hardware",
    description:
      "Complete point-of-sale, inventory, and supplier management system.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0e212c",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/images/CWLHardware_Logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/CWLHardware_Logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/CWLHardware_Logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
