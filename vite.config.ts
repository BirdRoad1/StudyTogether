import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import "dotenv/config";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    build: {
      outDir: "./dist/web/",
    },
    server: {
      proxy: {
        "/api": `http://localhost:${process.env.PORT}`,
      },
    },
    resolve: {
      alias: {
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
    define: {
      BACKEND_PORT: env.PORT
    },
  };
});
