import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // Netlify Dev applies the production CSP, which correctly blocks Vite's
  // inline React Refresh preamble. Vite still compiles TSX without the plugin.
  plugins: mode === "netlify" ? [] : [react()],
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
}));
