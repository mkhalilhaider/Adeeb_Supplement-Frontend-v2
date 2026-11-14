import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import "./styles/index.css";
import { router } from "./router";
import { persistOptions, queryClient } from "./lib/query-client";
import { useSession } from "./features/auth/session-store";
import { DeferredToaster } from "./components/ui/DeferredToaster";

// Restore any saved session before the first render (instant from the local snapshot).
useSession.getState().bootstrap();

// A refresh starts at the top of the page (the hero, scroll-in sections and animations are
// meant to be seen from there). Back/Forward still return to where the shopper was, because
// only a reload clears the router's saved positions.
try {
  if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
    sessionStorage.removeItem("react-router-scroll-positions");
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }
} catch {
  /* storage blocked: the router keeps its default behaviour */
}

// Handle for inspecting the cache from the browser console: always in dev, opt-in for a
// production build (VITE_DEBUG_QUERY=true) to diagnose request behaviour. Off by default.
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_QUERY === "true") {
  window.__queryClient = queryClient;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <RouterProvider router={router} />
      <DeferredToaster />
    </PersistQueryClientProvider>
  </StrictMode>,
);
