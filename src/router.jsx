import { createBrowserRouter } from "react-router";
import RouteErrorPage from "./pages/RouteErrorPage";
// Static: also used by the guards and error screen, so it ships in the main chunk anyway.
import NotFoundPage from "./pages/store/NotFoundPage";
import { RequireAdmin, RequireAuth } from "./features/auth/guards";
import { PageLoader } from "./components/ui/PageLoader";

/**
 * Load a page module on demand; each becomes its own code-split chunk.
 * @param {() => Promise<{ default: import("react").ComponentType }>} loader
 */
const page = (loader) => ({
  lazy: async () => ({ Component: (await loader()).default }),
});

/** Store, account and auth pages share the shopper layout. Admin has its own. */
export const router = createBrowserRouter([
  {
    path: "/",
    ...page(() => import("./components/layout/StoreLayout")),
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, ...page(() => import("./pages/store/HomePage")) },

          // Customer account (Phase 6 fills these in).
          {
            path: "account",
            element: <RequireAuth />,
            children: [],
          },

          ...(import.meta.env.DEV
            ? [
                { path: "dev/status", ...page(() => import("./pages/dev/StatusPage")) },
                { path: "dev/ui", ...page(() => import("./pages/dev/UiGalleryPage")) },
              ]
            : []),

          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },

  // Admin: separate layout, separate chunks; never linked from the storefront.
  {
    path: "/admin/login",
    ...page(() => import("./pages/admin/AdminLoginPage")),
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
  },
  {
    path: "/admin",
    element: <RequireAdmin />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        ...page(() => import("./components/layout/AdminLayout")),
        children: [
          { index: true, ...page(() => import("./pages/admin/AdminDashboardPage")) },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
