import { api, getData, request } from "../../lib/api";

/**
 * Every admin endpoint the panel uses (all require the admin role on the backend).
 * Notes on backend behaviour live next to each call.
 */

// ── Dashboard ───────────────────────────────────────────────────────────────
/** { stats, inventory: { lowStock, outOfStock }, recentOrders } */
export const fetchDashboard = ({ signal } = {}) => getData("/dashboard/summary", { signal });

// ── Orders ──────────────────────────────────────────────────────────────────
/**
 * Paged list: { orders, total, page, limit, pages, counts } — counts has one number per tab.
 * There is no admin single-order endpoint, so details come from these rows.
 */
export const fetchAdminOrders = (
  { page = 1, limit = 25, filter = "all", search = "" },
  { signal } = {},
) =>
  getData("/orders/admin", { query: { page, limit, filter, search: search || undefined }, signal });

export const setOrderStatus = (orderId, status) =>
  getData(`/orders/admin/${orderId}/status`, { method: "PATCH", body: { status } });

/** { order, alreadyBooked, portalUrl }; 502 with the courier's error message on failure. */
export const bookInstaWorld = (orderId) =>
  getData(`/orders/admin/${orderId}/instaworld`, { method: "POST" });

// ── Catalog ─────────────────────────────────────────────────────────────────
/** Active products only (the backend has no admin list that includes inactive ones). */
export async function fetchAdminProducts(
  { page = 1, limit = 25, search, category, brand, sort },
  { signal } = {},
) {
  const envelope = await request("/catalog/products", {
    // _t skips the CDN cache so edits show immediately.
    query: { page, limit, search: search || undefined, category, brand, sort, _t: Date.now() },
    signal,
  });
  return { items: envelope.data ?? [], meta: envelope.meta ?? {} };
}

export const fetchAdminProduct = (slug, { signal } = {}) =>
  getData(`/catalog/products/${encodeURIComponent(slug)}`, { query: { _t: Date.now() }, signal });

export const createProduct = (body) => getData("/catalog/admin/products", { method: "POST", body });
/** Send variant _ids to keep their SKUs; variants without _id get new SKUs. */
export const updateProduct = (id, body) =>
  getData(`/catalog/admin/products/${id}`, { method: "PATCH", body });
/** Soft delete: hidden everywhere (and from this panel — there's no way to list it again). */
export const deleteProduct = (id) => getData(`/catalog/admin/products/${id}`, { method: "DELETE" });

/** Multipart image upload (≤5 MB) → { image: { url, publicId } } */
export function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);
  return getData("/catalog/admin/upload-image", { method: "POST", body: form, timeout: 60_000 });
}

/** Excel (.xlsx/.xls ≤10 MB) → { createdCount, errorCount, products, errors } (201 or 207). */
export function bulkUploadProducts(file) {
  const form = new FormData();
  form.append("file", file);
  return getData("/catalog/admin/products/bulk-upload", {
    method: "POST",
    body: form,
    timeout: 120_000,
  });
}

/** kind: "categories" | "brands" */
export const createTaxon = (kind, body) =>
  getData(`/catalog/admin/${kind}`, { method: "POST", body });
export const updateTaxon = (kind, id, body) =>
  getData(`/catalog/admin/${kind}/${id}`, { method: "PATCH", body });
export const deleteTaxon = (kind, id) =>
  getData(`/catalog/admin/${kind}/${id}`, { method: "DELETE" });

// ── Coupons & delivery ──────────────────────────────────────────────────────
export const fetchCoupons = ({ signal } = {}) => getData("/coupons/admin", { signal });
/** No edit endpoint: change a coupon by deleting and re-creating it. */
export const createCoupon = (body) => getData("/coupons/admin", { method: "POST", body });
export const deleteCoupon = (id) => getData(`/coupons/admin/${id}`, { method: "DELETE" });

export const fetchDeliverySettings = ({ signal } = {}) =>
  getData("/delivery/admin/settings", { signal });
export const saveDeliverySettings = (body) =>
  getData("/delivery/admin/settings", { method: "PUT", body });

// ── Customers ───────────────────────────────────────────────────────────────
export const fetchInquiries = ({ signal } = {}) => getData("/contact/admin", { signal });
/** status: "new" | "read" | "responded" (not validated server-side — only send these). */
export const setInquiryStatus = (id, status) =>
  getData(`/contact/admin/${id}/status`, { method: "PATCH", body: { status } });

/** Checkouts idle for more than 30 minutes with at least one item (max 500). */
export const fetchAbandoned = ({ signal } = {}) =>
  getData("/abandoned-checkouts/admin", { signal });
export const deleteAbandoned = (id) =>
  getData(`/abandoned-checkouts/admin/${id}`, { method: "DELETE" });

/** { wishlists, total, page, limit, pages } — limit ≤ 50. */
export const fetchWishlists = ({ page = 1, limit = 25 }, { signal } = {}) =>
  getData("/wishlist/admin", { query: { page, limit }, signal });

// ── Content ─────────────────────────────────────────────────────────────────
export const fetchAdminReels = ({ signal } = {}) => getData("/reels/admin", { signal });
export const fetchReelSignature = () => getData("/reels/admin/upload-signature");
export const createReel = (body) => getData("/reels/admin", { method: "POST", body });
export const updateReel = (id, body) => getData(`/reels/admin/${id}`, { method: "PATCH", body });
export const deleteReel = (id) => getData(`/reels/admin/${id}`, { method: "DELETE" });
export const reorderReels = (items) =>
  getData("/reels/admin/reorder", { method: "POST", body: { items } });

export const fetchSeoSettings = ({ signal } = {}) => getData("/seo/settings", { signal });
export const saveSeoSettings = (body) => getData("/seo/settings", { method: "PUT", body });

export const fetchMarketingStats = ({ signal } = {}) => getData("/marketing/stats", { signal });
/** Sends to every matching registered customer and stays open until done — or one test email. */
export const sendBroadcast = (body) =>
  api.post("/marketing/broadcast", body, { timeout: 10 * 60_000 });

/** Query keys (all private: dropped on logout). */
export const adminKeys = {
  all: ["admin"],
  dashboard: ["admin", "dashboard"],
  orders: (params) => ["admin", "orders", params],
  products: (params) => ["admin", "products", params],
  product: (slug) => ["admin", "product", slug],
  coupons: ["admin", "coupons"],
  delivery: ["admin", "delivery"],
  inquiries: ["admin", "inquiries"],
  abandoned: ["admin", "abandoned"],
  wishlists: (page) => ["admin", "wishlists", page],
  reels: ["admin", "reels"],
  seo: ["admin", "seo"],
  marketing: ["admin", "marketing"],
};
