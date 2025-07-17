import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import "dotenv/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "./dist/web/",
  },
  server: {
    proxy: {
      "/api": `http://localhost:${process.env.PORT}`,
    },
  },
});
