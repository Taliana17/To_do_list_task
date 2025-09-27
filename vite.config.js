/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  base: '/To_do_list_task/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,              // para usar describe/it/expect sin importar
    environment: "jsdom",       // simula navegador
    setupFiles: "./tests/setupTests.js", // tu archivo de setup
    include: ["tests/**/*.{test,spec}.{js,jsx}"], // dónde buscar tests
  },
});
