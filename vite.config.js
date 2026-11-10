import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const CORE_UI = new RegExp(
  [
    String.raw`/src/components/ui/(Button|Spinner|CloudImage|Skeleton|States|Breadcrumbs|Input|Field|Badge|Rating|Price|QuantityStepper|SectionHeading)\.jsx$`,
    String.raw`/src/lib/(cn|format|cloudinary|hooks)\.js$`,
    String.raw`/src/features/catalog/lib/product-view\.js$`,
    String.raw`/lucide-react/dist/esm/(shared/|Icon\.mjs|createLucideIcon\.mjs|context\.mjs)`,
  ].join("|"),
);

// Port 3000 is in the backend's CORS allow-list, so local development works without backend changes.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks change rarely, so repeat visitors keep them cached.
        manualChunks(id) {
          // Small UI pieces and helpers almost every storefront page uses: one chunk instead of
          // a dozen sub-1 KB ones (each tiny chunk compresses worse and costs a request).
          // Only dependency-free files — anything importing Radix/Vaul stays out of it.
          if (CORE_UI.test(id.replaceAll("\\", "/"))) return "core";
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return "react";
          if (id.includes("@tanstack")) return "query";
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
});
