import { lazy, Suspense, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { CirclePlus, TextSearch } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CloudImage } from "../../components/ui/CloudImage";
import { Input, Select } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { formatPrice } from "../../lib/format";
import { useDebouncedValue } from "../../lib/hooks";
import { notify } from "../../lib/notify";
import { variantImage } from "../../features/catalog/lib/product-view";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import {
  adminKeys,
  deleteProduct,
  fetchAdminProducts,
  updateProduct,
} from "../../features/admin/api";
import { AdminHeader, EmptyRow, Pagination, Table, Toggle } from "../../features/admin/ui";
import { adminQuery, td, th } from "../../features/admin/format";

const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

function priceRange(variants) {
  const prices = variants.map((v) => v.salePrice ?? v.price).filter((p) => p > 0);
  if (!prices.length) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}

/** Shared photo still used by several products (the old site's category collages). */
const usesSharedImage = (product, counts) =>
  product.variants.some((v) => {
    const url = variantImage(v)?.url;
    return url && counts.get(url) > 1;
  });

/** /admin/products — active products with search, filters, featured switch and delete. */
export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { categories, brands } = useTaxonomy();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const category = params.get("category") ?? "";
  const brand = params.get("brand") ?? "";
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim(), 400);
  const [removing, setRemoving] = useState(/** @type {any} */ (null));
  const [busy, setBusy] = useState("");

  const queryParams = {
    page,
    limit: 25,
    search: term,
    category: category || undefined,
    brand: brand || undefined,
    sort: "newest",
  };
  const query = useQuery({
    queryKey: adminKeys.products(queryParams),
    queryFn: ({ signal }) => fetchAdminProducts(queryParams, { signal }),
    placeholderData: keepPreviousData,
    ...adminQuery,
  });

  const setParam = (key, value) =>
    setParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      if (key !== "page") p.delete("page");
      return p;
    });

  const items = query.data?.items ?? [];
  const imageUse = new Map();
  for (const p of items)
    for (const v of p.variants) {
      const url = variantImage(v)?.url;
      if (url) imageUse.set(url, (imageUse.get(url) ?? 0) + 1);
    }

  const toggleFeatured = async (product, value) => {
    setBusy(product._id);
    try {
      await updateProduct(product._id, { isFeatured: value });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy("");
    }
  };

  const confirmDelete = async () => {
    setBusy(removing._id);
    try {
      await deleteProduct(removing._id);
      notify.success(`Deleted ${removing.name}`);
      setRemoving(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <AdminHeader
        title="Products"
        description="Shows active products only — the backend can't list inactive or deleted ones, so they can't be found here again."
        actions={
          <>
            <Button to="/admin/products/bulk" variant="outline">
              Bulk upload
            </Button>
            <Button to="/admin/products/new" leadingIcon={<CirclePlus className="size-4" />}>
              New product
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_12rem]">
        <label>
          <span className="sr-only">Search products</span>
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (page !== 1) setParam("page", "");
            }}
            placeholder="Search by name"
            leading={<TextSearch aria-hidden="true" className="size-4" />}
          />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <Select value={category} onChange={(e) => setParam("category", e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Brand</span>
          <Select value={brand} onChange={(e) => setParam("brand", e.target.value)}>
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <Table label="Products">
            <thead>
              <tr>
                <th className={th}>Product</th>
                <th className={th}>Variants</th>
                <th className={th}>Price</th>
                <th className={th}>Stock</th>
                <th className={th}>Featured</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <EmptyRow colSpan={6}>No products found.</EmptyRow>}
              {items.map((p) => {
                const stock = p.variants.reduce((n, v) => n + (v.stockQuantity ?? 0), 0);
                const shared = usesSharedImage(p, imageUse);
                return (
                  <tr key={p._id}>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <span className="size-12 shrink-0 bg-shelf p-1">
                          <CloudImage
                            src={variantImage(p.variants[0])?.url}
                            alt=""
                            ratio={null}
                            trim
                            blend
                            sizes="48px"
                            className="size-full"
                          />
                        </span>
                        <span className="min-w-0">
                          <Link
                            to={`/admin/products/${p.slug}/edit`}
                            className="block font-medium hover:underline"
                          >
                            {p.name}
                          </Link>
                          <span className="block text-ink-3">
                            {p.brand?.name} · {p.category?.name}
                          </span>
                          {shared && (
                            <span className="mt-1 inline-block rounded-sm bg-warning-soft px-1.5 py-0.5 text-[11px] font-medium text-warning">
                              Needs real photo
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className={`${td} tabular-nums`}>{p.variants.length}</td>
                    <td className={`${td} whitespace-nowrap tabular-nums`}>
                      {priceRange(p.variants)}
                    </td>
                    <td className={`${td} tabular-nums ${stock === 0 ? "text-danger" : ""}`}>
                      {stock}
                    </td>
                    <td className={td}>
                      <Toggle
                        checked={Boolean(p.isFeatured)}
                        onChange={(v) => toggleFeatured(p, v)}
                        disabled={busy === p._id}
                        label={`Feature ${p.name}`}
                        hideLabel
                      />
                    </td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <Link to={`/admin/products/${p.slug}/edit`} className="font-medium underline">
                        Edit
                      </Link>
                      <a
                        href={`/product/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-ink-2 underline"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => setRemoving(p)}
                        className="ml-3 text-danger underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination
            page={query.data.meta.page ?? page}
            pages={query.data.meta.pages}
            total={query.data.meta.total}
            label="products"
            onPage={(p) => setParam("page", String(p))}
          />
        </>
      )}

      {removing && (
        <Suspense fallback={null}>
          <ConfirmDialog
            open
            onOpenChange={(o) => !o && setRemoving(null)}
            title={`Delete ${removing.name}?`}
            description="It disappears from the store and from this panel. The backend has no way to list deleted products, so you couldn't restore it from here."
            confirmLabel="Delete product"
            pending={busy === removing._id}
            onConfirm={confirmDelete}
          />
        </Suspense>
      )}
    </div>
  );
}
