import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CirclePlus, Trash } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea, controlClasses } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { ApiError, errorMessage } from "../../lib/api/errors";
import { cn } from "../../lib/cn";
import { notify } from "../../lib/notify";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import {
  adminKeys,
  createProduct,
  fetchAdminProduct,
  updateProduct,
} from "../../features/admin/api";
import { ImageUpload } from "../../features/admin/components/ImageUpload";
import {
  emptyVariant,
  formToBody,
  productToForm,
  validateProductForm,
} from "../../features/admin/lib/product-form";
import { AdminHeader, Panel, Toggle } from "../../features/admin/ui";
import { adminQuery } from "../../features/admin/format";
import NotFoundPage from "../store/NotFoundPage";

const cell = cn(controlClasses, "h-10 px-2 text-small");

function VariantsEditor({ variants, onChange, errors }) {
  const update = (i, patch) => onChange(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const setDefault = (i) => onChange(variants.map((v, j) => ({ ...v, isDefault: j === i })));
  const remove = (i) => {
    const next = variants.filter((_, j) => j !== i);
    if (next.length && !next.some((v) => v.isDefault)) next[0] = { ...next[0], isDefault: true };
    onChange(next);
  };
  const err = (i, f) => errors[`variants.${i}.${f}`];

  return (
    <div className="flex flex-col gap-3">
      {variants.map((v, i) => (
        <fieldset key={v.key} className="rounded-sm border border-line p-3">
          <legend className="px-1 text-small font-semibold">
            Variant {i + 1}
            {v.sku && (
              <span className="ml-2 font-mono text-[12px] font-normal text-ink-3">{v.sku}</span>
            )}
          </legend>
          <div className="flex flex-wrap items-start gap-3">
            <ImageUpload
              compact
              label={`Image for variant ${i + 1}`}
              value={v.image}
              onChange={(image) => update(i, { image })}
            />
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["flavor", "Flavour", "text"],
                ["weight", "Weight / size", "text"],
                ["serving", "Servings", "text"],
                ["price", "Price (Rs)", "number"],
                ["salePrice", "Sale price", "number"],
                ["stockQuantity", "Stock", "number"],
              ].map(([field, label, type]) => (
                <label key={field} className="flex flex-col gap-1 text-[12px]">
                  <span className="font-medium text-ink-2">{label}</span>
                  <input
                    type={type}
                    inputMode={type === "number" ? "numeric" : undefined}
                    min={type === "number" ? 0 : undefined}
                    value={v[field]}
                    onChange={(e) => update(i, { [field]: e.target.value })}
                    aria-invalid={err(i, field) ? true : undefined}
                    className={cell}
                  />
                  {err(i, field) && (
                    <span role="alert" className="text-danger">
                      {err(i, field)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-small">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="default-variant"
                checked={v.isDefault}
                onChange={() => setDefault(i)}
                className="size-4 accent-ink"
              />
              Shown first
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={v.hidden}
                onChange={(e) => update(i, { hidden: e.target.checked })}
                className="size-4 accent-ink"
              />
              Hidden from the store
            </label>
            <label className="inline-flex items-center gap-2">
              Low-stock alert at
              <input
                type="number"
                min={0}
                value={v.lowStockThreshold}
                onChange={(e) => update(i, { lowStockThreshold: e.target.value })}
                className={cn(cell, "w-20")}
                aria-label={`Low-stock alert for variant ${i + 1}`}
              />
            </label>
            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-auto inline-flex items-center gap-1 text-danger underline"
              >
                <Trash aria-hidden="true" className="size-4" /> Remove variant
              </button>
            )}
          </div>
        </fieldset>
      ))}
      <Button
        variant="outline"
        className="self-start"
        leadingIcon={<CirclePlus className="size-4" />}
        onClick={() => onChange([...variants, emptyVariant(variants.length === 0)])}
      >
        Add variant
      </Button>
      {errors.variants && (
        <p role="alert" className="text-small text-danger">
          {errors.variants}
        </p>
      )}
    </div>
  );
}

function ProductForm({ product }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { categories, brands } = useTaxonomy();
  const [form, setForm] = useState(() => productToForm(product));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  // Bumped after a failed save: focus moves to the first field with a problem.
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    if (focusTick) formRef.current?.querySelector("[aria-invalid=true]")?.focus();
  }, [focusTick]);
  const formRef = useRef(/** @type {HTMLFormElement|null} */ (null));
  const editing = Boolean(product);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBefore = (e) => e.preventDefault();
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  const save = async (event) => {
    event.preventDefault();
    const found = validateProductForm(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setFocusTick((t) => t + 1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = formToBody(form);
      const saved = editing ? await updateProduct(product._id, body) : await createProduct(body);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      notify.success(editing ? "Product saved" : "Product created");
      if (!editing || saved?.slug !== product.slug)
        navigate(`/admin/products/${saved.slug}/edit`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={save} noValidate className="flex flex-col gap-6">
      <Panel title="Details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" required error={errors.name} className="md:col-span-2">
            {(f) => (
              <Input {...f} value={form.name} onChange={(e) => set({ name: e.target.value })} />
            )}
          </Field>
          <Field label="Category" required error={errors.category}>
            {(f) => (
              <Select
                {...f}
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
              >
                <option value="">Choose…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Brand" required error={errors.brand}>
            {(f) => (
              <Select {...f} value={form.brand} onChange={(e) => set({ brand: e.target.value })}>
                <option value="">Choose…</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label="Description"
            required
            hint="Plain text. A blank line starts a new paragraph."
            error={errors.description}
            className="md:col-span-2"
          >
            {(f) => (
              <Textarea
                {...f}
                rows={8}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
              />
            )}
          </Field>
          <div className="md:col-span-2">
            <Toggle
              checked={form.isFeatured}
              onChange={(isFeatured) => set({ isFeatured })}
              label="Featured on the homepage"
            />
          </div>
        </div>
      </Panel>

      <Panel title="Variants">
        <VariantsEditor
          variants={form.variants}
          onChange={(variants) => set({ variants })}
          errors={errors}
        />
      </Panel>

      <Panel title="Search engines">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Page title" hint="Optional — defaults to “Name price in Pakistan”">
            {(f) => (
              <Input
                {...f}
                value={form.metaTitle}
                maxLength={70}
                onChange={(e) => set({ metaTitle: e.target.value })}
              />
            )}
          </Field>
          <Field label="Keywords" hint="Optional, comma separated">
            {(f) => (
              <Input
                {...f}
                value={form.keywords}
                onChange={(e) => set({ keywords: e.target.value })}
              />
            )}
          </Field>
          <Field
            label="Meta description"
            hint="Optional — about 150 characters"
            className="md:col-span-2"
          >
            {(f) => (
              <Textarea
                {...f}
                rows={2}
                maxLength={300}
                value={form.metaDescription}
                onChange={(e) => set({ metaDescription: e.target.value })}
              />
            )}
          </Field>
        </div>
      </Panel>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        {error && (
          <p role="alert" className="w-full text-small text-danger">
            {error}
          </p>
        )}
        <Button type="submit" loading={saving}>
          {editing ? "Save changes" : "Create product"}
        </Button>
        <Button to="/admin/products" variant="outline">
          Cancel
        </Button>
        {editing && (
          <a
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-small underline"
          >
            View in store
          </a>
        )}
      </div>
    </form>
  );
}

/** /admin/products/new and /admin/products/:slug/edit */
export default function ProductEditPage() {
  const { slug } = useParams();
  const query = useQuery({
    queryKey: adminKeys.product(slug),
    queryFn: ({ signal }) => fetchAdminProduct(slug, { signal }),
    enabled: Boolean(slug),
    ...adminQuery,
    staleTime: 0,
  });

  const title = slug ? "Edit product" : "New product";
  const back = (
    <Link
      to="/admin/products"
      className="mb-3 inline-flex items-center gap-1 text-small text-ink-2 hover:text-ink"
    >
      <ArrowLeft aria-hidden="true" className="size-4" /> Products
    </Link>
  );

  if (slug && query.isPending) return <Skeleton className="h-96 w-full" />;
  if (slug && query.error instanceof ApiError && query.error.isNotFound) return <NotFoundPage />;
  if (slug && query.isError)
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  return (
    <div className="max-w-5xl">
      {back}
      <AdminHeader
        title={slug ? query.data.name : title}
        description={
          slug
            ? "Changes go live as soon as you save."
            : "New products are visible in the store right away."
        }
      />
      <ProductForm key={slug ?? "new"} product={slug ? query.data : null} />
    </div>
  );
}
