import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Toaster } from "sonner";
import "./styles/index.css";
import { router } from "./router";
import { persistOptions, queryClient } from "./lib/query-client";
import { useSession } from "./features/auth/session-store";

// Restore any saved session before the first render (instant from the local snapshot).
useSession.getState().bootstrap();

// Handle for inspecting the cache from the browser console: always in dev, opt-in for a
// production build (VITE_DEBUG_QUERY=true) to diagnose request behaviour. Off by default.
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_QUERY === "true") {
  window.__queryClient = queryClient;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-md !border !border-line !bg-surface !text-ink !shadow-overlay !font-sans",
            description: "!text-ink-2",
          },
        }}
      />
    </PersistQueryClientProvider>
  </StrictMode>,
);
