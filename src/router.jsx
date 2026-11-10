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
          { path: "shop", ...page(() => import("./pages/store/ShopPage")) },
          { path: "category/:slug", ...page(() => import("./pages/store/CategoryPage")) },
          { path: "brand/:slug", ...page(() => import("./pages/store/BrandPage")) },
          { path: "brands", ...page(() => import("./pages/store/BrandsPage")) },
          { path: "product/:slug", ...page(() => import("./pages/store/ProductPage")) },
          { path: "cart", ...page(() => import("./pages/store/CartPage")) },
          { path: "wishlist", ...page(() => import("./pages/store/WishlistPage")) },
          {
            path: "order/:orderNumber/confirmed",
            ...page(() => import("./pages/store/OrderConfirmedPage")),
          },
          { path: "track-order", ...page(() => import("./pages/store/TrackOrderPage")) },
          { path: "track", ...page(() => import("./pages/store/TrackOrderPage")) },

          // Sign-in pages. The last four paths are fixed by backend emails and redirects.
          { path: "login", ...page(() => import("./pages/auth/LoginPage")) },
          { path: "register", ...page(() => import("./pages/auth/RegisterPage")) },
          { path: "forgot-password", ...page(() => import("./pages/auth/ForgotPasswordPage")) },
          { path: "reset-password", ...page(() => import("./pages/auth/ResetPasswordPage")) },
          { path: "verify-email", ...page(() => import("./pages/auth/VerifyEmailPage")) },
          {
            path: "auth/google/callback",
            ...page(() => import("./pages/auth/GoogleCallbackPage")),
          },

          // Customer account.
          {
            path: "account",
            element: <RequireAuth />,
            children: [
              {
                ...page(() => import("./pages/account/AccountLayout")),
                children: [
                  { index: true, ...page(() => import("./pages/account/AccountOverviewPage")) },
                  { path: "orders", ...page(() => import("./pages/account/OrdersPage")) },
                  {
                    path: "orders/:orderId",
                    ...page(() => import("./pages/account/OrderDetailPage")),
                  },
                  { path: "addresses", ...page(() => import("./pages/account/AddressesPage")) },
                  { path: "settings", ...page(() => import("./pages/account/SettingsPage")) },
                  { path: "*", element: <NotFoundPage /> },
                ],
              },
            ],
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

  // Checkout: its own quiet layout (no menus or search competing with the form).
  {
    path: "/checkout",
    ...page(() => import("./components/layout/CheckoutLayout")),
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    children: [{ index: true, ...page(() => import("./pages/checkout/CheckoutPage")) }],
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
