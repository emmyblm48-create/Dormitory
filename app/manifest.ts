import type { MetadataRoute } from "next";

// Lets the app be added to the Home Screen, which iOS requires before it allows Web Push
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dormitory",
    short_name: "Dormitory",
    description: "Dormitory Management System",
    start_url: "/",
    display: "standalone",
    background_color: "#F0F7FF",
    theme_color: "#0850B0",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
