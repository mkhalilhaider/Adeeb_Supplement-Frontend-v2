import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Star, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { formatDate } from "../../lib/format";
import { cloudinaryUrl } from "../../lib/cloudinary";
import { cn } from "../../lib/cn";
import { notify } from "../../lib/notify";
import { useForm } from "../../lib/use-form";
import {
  adminKeys,
  createTestimonial,
  deleteTestimonial,
  fetchAdminProducts,
  fetchAdminTestimonials,
  reorderTestimonials,
  updateTestimonial,
  uploadImage,
} from "../../features/admin/api";
import { AdminHeader, EmptyRow, Panel, Table, Toggle } from "../../features/admin/ui";
import { adminQuery, td, th } from "../../features/admin/format";

const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ name: "", text: "", reviewedAt: today(), product: "" });

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Enter the reviewer's name";
  if (v.text.trim().length < 3) e.text = "Paste the review text";
  if (!v.reviewedAt) e.reviewedAt = "Pick the review date";
  return e;
}

function Stars({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Stars" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="rounded-sm p-0.5"
        >
          <Star
            aria-hidden="true"
            className={cn("size-7", n <= value ? "fill-brand text-brand" : "text-line-strong")}
          />
        </button>
      ))}
    </div>
  );
}

const MAX_PHOTOS = 6;

/**
 * The photos the reviewer posted with the review (save them from Google, then upload here).
 * Thumbnails with a remove button, plus an upload button (several at once, up to 6 in all).
 */
function PhotosField({ photos, onChange }) {
  const [busy, setBusy] = useState(false);
  const upload = async (files) => {
    const room = MAX_PHOTOS - photos.length;
    const chosen = [...files].slice(0, room);
    if (!chosen.length) return;
    setBusy(true);
    try {
      const added = [];
      for (const file of chosen) {
        const { image } = await uploadImage(file);
        added.push({ url: image.url, publicId: image.publicId ?? "" });
      }
      onChange([...photos, ...added]);
      if (files.length > room) notify.info(`Up to ${MAX_PHOTOS} photos per review`);
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <fieldset className="flex flex-col gap-1.5 md:col-span-2">
      <legend className="mb-1.5 text-small font-semibold">Photos from the review</legend>
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((p, i) => (
          <div key={p.url} className="relative">
            <img
              src={cloudinaryUrl(p.url, { w: 160, h: 160, crop: "fill" })}
              alt={`Review upload ${i + 1}`}
              className="size-20 rounded-md border border-line object-cover"
            />
            <button
              type="button"
              aria-label={`Remove review upload ${i + 1}`}
              onClick={() => onChange(photos.filter((x) => x !== p))}
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-ink text-white shadow hover:bg-danger"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong text-[12px] font-semibold text-ink-2 hover:bg-shelf has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
            <ImagePlus aria-hidden="true" className="size-5" />
            {busy ? "Uploading…" : "Add"}
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg"
              multiple
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                upload(e.target.files ?? []);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <p className="text-small text-ink-3">
        Optional, up to {MAX_PHOTOS}. The first one becomes the card picture on the homepage.
      </p>
    </fieldset>
  );
}

/** Where a review shows on product pages (stored as productPages). */
const PRODUCT_PAGES = [
  {
    value: "all",
    label: "Its product + all product pages",
    short: "Its product + all",
    hint: "First on its own product's page, then on every other product page.",
  },
  {
    value: "own",
    label: "Only its product's page",
    short: "Only its product",
    hint: "Only on the page of the product it's linked to.",
  },
  { value: "off", label: "Off", short: "Off", hint: "Never shown on product pages." },
];

/**
 * /admin/reviews — reviews copied from the store's Google listing, shown on the homepage in
 * this order and on product pages as each one is set. Linking a product gives the card its
 * photo and a link to the product page.
 */
export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: adminKeys.testimonials,
    queryFn: ({ signal }) => fetchAdminTestimonials({ signal }),
    ...adminQuery,
  });
  const products = useQuery({
    queryKey: adminKeys.products({ picker: true }),
    queryFn: ({ signal }) =>
      fetchAdminProducts({ page: 1, limit: 100, status: "active" }, { signal }),
    ...adminQuery,
    staleTime: 5 * 60_000,
  });
  const productOptions = useMemo(
    () => [...(products.data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [products.data],
  );

  const form = useForm(blank);
  const [rating, setRating] = useState(5);
  const [visible, setVisible] = useState(true);
  const [productPages, setProductPages] = useState("all");
  const [photos, setPhotos] = useState(/** @type {{url: string, publicId: string}[]} */ ([]));
  const [editing, setEditing] = useState(/** @type {any} */ (null));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(/** @type {any} */ (null));

  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.testimonials });

  const resetForm = () => {
    form.reset(blank());
    setRating(5);
    setVisible(true);
    setProductPages("all");
    setPhotos([]);
    setEditing(null);
    setError("");
  };

  const startEdit = (t) => {
    form.set("name", t.name);
    form.set("text", t.text);
    form.set("reviewedAt", t.reviewedAt ? String(t.reviewedAt).slice(0, 10) : today());
    form.set("product", t.product?._id ?? "");
    setRating(t.rating);
    setVisible(t.isVisible !== false);
    setProductPages(t.productPages ?? "all");
    setPhotos(t.photos ?? []);
    setEditing(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onValid = async (v) => {
    setPending(true);
    setError("");
    const body = {
      name: v.name.trim(),
      text: v.text.trim(),
      rating,
      reviewedAt: v.reviewedAt,
      product: v.product || null,
      isVisible: visible,
      productPages,
      photos,
      source: "google",
    };
    try {
      if (editing) await updateTestimonial(editing._id, body);
      else await createTestimonial(body);
      notify.success(editing ? "Review saved" : "Review added");
      resetForm();
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  /** Save one field straight from the table (homepage switch, product pages). */
  const saveField = async (t, patch) => {
    try {
      await updateTestimonial(t._id, patch);
      refresh();
    } catch (err) {
      notify.error(err);
    }
  };

  const move = async (index, step) => {
    const list = [...(query.data ?? [])];
    const target = index + step;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    queryClient.setQueryData(adminKeys.testimonials, list);
    try {
      await reorderTestimonials(list.map((t) => t._id));
    } catch (err) {
      notify.error(err);
    } finally {
      refresh();
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      await deleteTestimonial(removing._id);
      notify.success("Review deleted");
      if (editing?._id === removing._id) resetForm();
      setRemoving(null);
      refresh();
    } catch (err) {
      notify.error(err);
    } finally {
      setPending(false);
    }
  };

  const list = query.data ?? [];
  const shown = list.filter((t) => t.isVisible);
  const average = shown.length
    ? (shown.reduce((s, t) => s + t.rating, 0) / shown.length).toFixed(1)
    : "–";

  return (
    <div className="max-w-6xl">
      <AdminHeader
        title="Reviews"
        description="Copy your Google reviews here, with any photos the reviewer posted. Choose where each one shows: the homepage (in this order) and product pages. Link a product to show its photo and a link to it."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["On homepage", shown.length],
          ["Average shown", average],
          ["Linked to a product", list.filter((t) => t.product).length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-card border border-line bg-surface px-4 py-3">
            <p className="text-small font-semibold text-ink-3">{label}</p>
            <p className="mt-1 text-[2rem] font-display">{value}</p>
          </div>
        ))}
      </div>

      <Panel
        title={editing ? `Edit review by ${editing.name}` : "Add a review"}
        actions={
          editing && (
            <button type="button" className="text-small underline" onClick={resetForm}>
              Cancel editing
            </button>
          )
        }
      >
        <form
          onSubmit={(e) => form.handleSubmit(validate, onValid)(e)}
          noValidate
          className="grid gap-4 md:grid-cols-2"
        >
          <Field label="Reviewer name" required error={form.errors.name}>
            {(f) => <Input {...f} {...form.field("name")} autoComplete="off" />}
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-small font-semibold">Stars</span>
            <Stars value={rating} onChange={setRating} />
          </div>
          <Field
            className="md:col-span-2"
            label="Review text"
            required
            hint="Paste it exactly as it appears on Google"
            error={form.errors.text}
          >
            {(f) => <Textarea {...f} {...form.field("text")} rows={4} />}
          </Field>
          <Field label="Review date" required error={form.errors.reviewedAt}>
            {(f) => <Input {...f} {...form.field("reviewedAt")} type="date" max={today()} />}
          </Field>
          <Field
            label="Link to product"
            hint="Optional — its photo shows on the card and it links to the product"
          >
            {(f) => (
              <Select {...f} {...form.field("product")}>
                <option value="">No product (review of the store)</option>
                {productOptions.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="flex items-center">
            <Toggle checked={visible} onChange={setVisible} label="Show on homepage" />
          </div>
          <Field
            label="Show on product pages"
            hint={PRODUCT_PAGES.find((o) => o.value === productPages)?.hint}
          >
            {(f) => (
              <Select {...f} value={productPages} onChange={(e) => setProductPages(e.target.value)}>
                {PRODUCT_PAGES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <PhotosField photos={photos} onChange={setPhotos} />
          {error && (
            <p role="alert" className="text-small text-danger md:col-span-2">
              {error}
            </p>
          )}
          <div className="md:col-span-2">
            <Button type="submit" loading={pending}>
              {editing ? "Save review" : "Add review"}
            </Button>
          </div>
        </form>
      </Panel>

      <div className="mt-6">
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton className="h-48" />
        ) : (
          <Table label="Reviews">
            <thead>
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Reviewer</th>
                <th className={th}>Stars</th>
                <th className={th}>Review</th>
                <th className={th}>Product</th>
                <th className={th}>Homepage</th>
                <th className={th}>Product pages</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <EmptyRow colSpan={8}>
                  No reviews yet — add your first Google review above.
                </EmptyRow>
              )}
              {list.map((t, i) => (
                <tr key={t._id}>
                  <td className={`${td} whitespace-nowrap`}>
                    <button
                      type="button"
                      aria-label={`Move review by ${t.name} up`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded-sm p-1 hover:bg-shelf disabled:opacity-30"
                    >
                      <ArrowUp aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move review by ${t.name} down`}
                      disabled={i === list.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded-sm p-1 hover:bg-shelf disabled:opacity-30"
                    >
                      <ArrowDown aria-hidden="true" className="size-4" />
                    </button>
                  </td>
                  <td className={td}>
                    <span className="font-semibold">{t.name}</span>
                    <span className="block text-[12px] text-ink-3">
                      Google · {formatDate(t.reviewedAt)}
                    </span>
                  </td>
                  <td
                    className={`${td} whitespace-nowrap text-brand`}
                    aria-label={`${t.rating} stars`}
                  >
                    {"★".repeat(t.rating)}
                    <span className="text-line-strong">{"★".repeat(5 - t.rating)}</span>
                  </td>
                  <td className={`${td} max-w-xs text-ink-2`}>
                    <span className="line-clamp-2">{t.text}</span>
                    {t.photos?.length > 0 && (
                      <span className="mt-1.5 flex gap-1">
                        {t.photos.map((p) => (
                          <img
                            key={p.url}
                            src={cloudinaryUrl(p.url, { w: 160, h: 160, crop: "fill" })}
                            alt=""
                            className="size-8 rounded-sm border border-line object-cover"
                          />
                        ))}
                      </span>
                    )}
                  </td>
                  <td className={`${td} text-small`}>
                    {t.product ? t.product.name : <span className="text-ink-3">—</span>}
                  </td>
                  <td className={td}>
                    <Toggle
                      checked={t.isVisible}
                      onChange={(next) => saveField(t, { isVisible: next })}
                      label={`Show review by ${t.name} on the homepage`}
                      hideLabel
                    />
                  </td>
                  <td className={td}>
                    <Select
                      aria-label={`Product pages for the review by ${t.name}`}
                      value={t.productPages ?? "all"}
                      onChange={(e) => saveField(t, { productPages: e.target.value })}
                      className="h-9 min-w-44 text-small"
                    >
                      {PRODUCT_PAGES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.short}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <button
                      type="button"
                      className="mr-3 font-medium underline"
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-danger underline"
                      onClick={() => setRemoving(t)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {removing && (
        <Suspense fallback={null}>
          <ConfirmDialog
            open
            onOpenChange={(o) => !o && setRemoving(null)}
            title={`Delete the review by ${removing.name}?`}
            description="It disappears from the homepage. This can't be undone."
            confirmLabel="Delete review"
            pending={pending}
            onConfirm={remove}
          />
        </Suspense>
      )}
    </div>
  );
}
