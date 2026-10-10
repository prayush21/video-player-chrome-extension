import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Everything in public/ (manifest.json, background.js, the x.com content
// scripts, icons, clips) is copied to dist/ as-is. The React popup/player
// page is built from index.html.
export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
