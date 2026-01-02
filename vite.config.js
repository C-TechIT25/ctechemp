import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // ✅ REQUIRED FOR ELECTRON (file://)

  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"]
      }
    })
  ],

  optimizeDeps: {
    include: ["@emotion/react", "@emotion/styled"]
  }
});
