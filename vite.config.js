import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const CORE_UI = new RegExp(
  [
    String.raw`/src/components/ui/(Button|Spinner|CloudImage|Skeleton|States|Breadcrumbs|Price|QuantityStepper)\.jsx$`,
    String.raw`/src/lib/(cn|format|cloudinary|hooks)\.js$`,
    String.raw`/src/features/catalog/lib/product-view\.js$`,
    String.raw`/lucide-react/dist/esm/(shared/|Icon\.mjs|createLucideIcon\.mjs|context\.mjs)`,
  ].join("|"),
);

const RARE_PAGES =
  /(Admin\w*|Account\w*|OrdersPage|OrderDetailPage|AddressesPage|SettingsPage|LoginPage|RegisterPage|ForgotPasswordPage|ResetPasswordPage|VerifyEmailPage|GoogleCallbackPage|AboutPage|ContactPage|LegalPage|TrackOrderPage|StatusPage|UiGalleryPage)-[\w-]+\.js$/;

/**
 * Run the Vercel functions in /api inside the dev server, with every variable from .env and
 * .env.local (not only VITE_ ones) — so the link previews and sitemap can be
 * tried locally. Server-only keys stay on the Node side; nothing is exposed to the browser.
 */
function vercelFunctionsDev() {
  return {
    name: "vercel-functions-dev",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const [key, value] of Object.entries({ API_URL: env.VITE_API_URL, ...env })) {
        if (process.env[key] === undefined && value) process.env[key] = value;
      }
      server.middlewares.use(async (req, res, next) => {
        const match = /^\/(?:api\/(preview|sitemap)|(sitemap)\.xml)(?:\?|$)/.exec(req.url ?? "");
        if (!match) return next();
        try {
          const fn = await server.ssrLoadModule(`/api/${match[1] ?? match[2]}.js`);
          const response = await fn.GET(new Request(`http://localhost${req.url}`));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

// Port 3000 is in the backend's CORS allow-list, so local development works without backend changes.
export default defineConfig({
  plugins: [react(), tailwindcss(), vercelFunctionsDev()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  build: {
    target: "es2022",
    sourcemap: true,
    // Every lazy route ships a list of files to preload with it, and those lists live in the
    // entry chunk everyone downloads. Account, sign-in and admin pages are visited rarely, so
    // they skip the list (their files still load on visit, just without the head start) and
    // the storefront's first load stays small.
    modulePreload: {
      resolveDependencies: (filename, deps) => (RARE_PAGES.test(filename) ? [] : deps),
    },
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
    include: ["src/**/*.test.js", "api/**/*.test.js"],
  },
});
