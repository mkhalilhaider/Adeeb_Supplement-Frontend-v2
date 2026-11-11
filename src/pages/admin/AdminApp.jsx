import { lazy } from "react";
import { Route, Routes } from "react-router";
import AdminLayout from "../../components/layout/AdminLayout";
import NotFoundPage from "../store/NotFoundPage";

const Dashboard = lazy(() => import("./AdminDashboardPage"));
const Orders = lazy(() => import("./AdminOrdersPage"));
const Abandoned = lazy(() => import("./AdminAbandonedPage"));
const Coupons = lazy(() => import("./AdminCouponsPage"));
const Delivery = lazy(() => import("./AdminDeliveryPage"));
const Products = lazy(() => import("./AdminProductsPage"));
const ProductEdit = lazy(() => import("./AdminProductEditPage"));
const BulkUpload = lazy(() => import("./AdminBulkUploadPage"));
const Taxonomy = lazy(() => import("./AdminTaxonomyPage"));
const Inquiries = lazy(() => import("./AdminInquiriesPage"));
const Wishlists = lazy(() => import("./AdminWishlistsPage"));
const Reels = lazy(() => import("./AdminReelsPage"));
const Seo = lazy(() => import("./AdminSeoPage"));
const Marketing = lazy(() => import("./AdminMarketingPage"));

/**
 * The admin area's routes, behind RequireAdmin. Kept here (not in the app router) so the
 * storefront's entry file carries a single admin route instead of the whole admin map.
 * AdminLayout's <Outlet> shows each page inside its own Suspense boundary.
 */
export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="abandoned" element={<Abandoned />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductEdit />} />
        <Route path="products/bulk" element={<BulkUpload />} />
        <Route path="products/:slug/edit" element={<ProductEdit />} />
        <Route path="categories" element={<Taxonomy />} />
        <Route path="brands" element={<Taxonomy />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="wishlists" element={<Wishlists />} />
        <Route path="reels" element={<Reels />} />
        <Route path="seo" element={<Seo />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
