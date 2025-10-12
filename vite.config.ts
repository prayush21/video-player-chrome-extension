import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, existsSync } from "fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      {
        name: "copy-extension-files",
        closeBundle() {
          // Copy manifest.json
          copyFileSync("manifest.json", "dist/manifest.json");

          // Copy background.js
          copyFileSync("background.js", "dist/background.js");

          // Copy icons directory if it exists
          if (existsSync("icons")) {
            if (!existsSync("dist/icons")) {
              mkdirSync("dist/icons", { recursive: true });
            }
            const iconFiles = ["icon16.png", "icon48.png", "icon128.png"];
            iconFiles.forEach((file) => {
              const srcPath = `icons/${file}`;
              if (existsSync(srcPath)) {
                copyFileSync(srcPath, `dist/icons/${file}`);
              }
            });
          }
        },
      },
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
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
  };
});
