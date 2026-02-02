import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/moonrise-svg/" : "/",
  build: {
    rollupOptions: {
      input: {
        gallery: resolve(__dirname, "index.html"),
        moonrise: resolve(__dirname, "moonrise/index.html"),
        grid: resolve(__dirname, "grid/index.html"),
      },
    },
  },
}));
