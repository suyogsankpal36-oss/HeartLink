import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("victory-vendor") || id.includes("d3-")) {
            return "vendor-charts";
          }
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("firebase")) {
            return "vendor-firebase";
          }
          if (id.includes("socket.io-client") || id.includes("engine.io-client")) {
            return "vendor-socket";
          }
          if (id.includes("react-router") || id.includes("react-dom") || id.includes("\\react\\") || id.includes("/react/")) {
            return "vendor-react";
          }
        },
      },
    },
  },
});
