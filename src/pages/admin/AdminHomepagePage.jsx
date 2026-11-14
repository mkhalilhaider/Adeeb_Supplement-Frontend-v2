import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Trash2, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { notify } from "../../lib/notify";
import {
  adminKeys,
  fetchAdminProducts,
  fetchHomepageContent,
  saveHomepageContent,
  uploadImage,
} from "../../features/admin/api";
import { adminQuery } from "../../features/admin/format";
import { AdminHeader, Panel } from "../../features/admin/ui";
import { isPurchasable, variantImage } from "../../features/catalog/lib/product-view";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { HERO_PACKS, LEAD_PACK } from "../../features/home/hero-packs";
import { DEFAULT_SPOTLIGHT, GOAL_ORDER, GOALS } from "../../features/home/homepage-defaults";

const MAX_HERO = 8;
const NO_IMAGE = { url: "", publicId: "" };
const idOf = (v) => (v && typeof v === "object" ? v._id : v) || "";

/** The saved content (populated) as form values: ids instead of objects. */
function fromSaved(saved) {
  const img = (i) => (i?.url ? i : NO_IMAGE);
  return {
    hero: (saved.hero ?? []).map((h) => ({
      product: idOf(h.product),
      eyebrow: h.eyebrow ?? "",
      title: h.title ?? "",
      link: { type: h.link?.type ?? "product", value: h.link?.value ?? "" },
      image: img(h.image),
    })),
    menuFeature: {
      product: idOf(saved.menuFeature?.product),
      label: saved.menuFeature?.label ?? "",
      title: saved.menuFeature?.title ?? "",
      image: img(saved.menuFeature?.image),
    },
    goalTile: {
      category: idOf(saved.goalTile?.category),
      title: saved.goalTile?.title ?? "",
      description: saved.goalTile?.description ?? "",
      buttonText: saved.goalTile?.buttonText ?? "",
      product: idOf(saved.goalTile?.product),
      image: img(saved.goalTile?.image),
    },
    goalTitles: { ...(saved.goalTitles ?? {}) },
    spotlight: {
      link: {
        type: saved.spotlight?.link?.type ?? "category",
        value: saved.spotlight?.link?.value ?? "",
      },
      eyebrow: saved.spotlight?.eyebrow ?? "",
      title: saved.spotlight?.title ?? "",
      description: saved.spotlight?.description ?? "",
      buttonText: saved.spotlight?.buttonText ?? "",
      product: idOf(saved.spotlight?.product),
      image: img(saved.spotlight?.image),
    },
  };
}

/** Starting values when nothing has been saved yet: exactly what the homepage shows today. */
function fromBuiltIn(products, categories) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const cat = (slug) => categories.find((c) => c.slug === slug);
  const lead = bySlug.get(LEAD_PACK.slug);
  const packs = [LEAD_PACK, ...HERO_PACKS.filter((p) => p !== LEAD_PACK)];
  const goalCat = cat(GOAL_ORDER[0]);
  const spotCat = cat(DEFAULT_SPOTLIGHT.slug);
  return {
    hero: packs
      .map((p) => ({ pack: p, product: bySlug.get(p.slug) }))
      .filter((x) => x.product)
      .map(({ pack, product }) => ({
        product: product._id,
        eyebrow: pack.brand,
        title: pack.short,
        link: { type: "product", value: "" },
        image: NO_IMAGE,
      })),
    menuFeature: {
      product: lead?._id ?? "",
      label: "Featured pick",
      title: LEAD_PACK.short,
      image: NO_IMAGE,
    },
    goalTile: {
      category: goalCat?._id ?? "",
      title: GOALS[GOAL_ORDER[0]],
      description: "",
      buttonText: "",
      product: lead?._id ?? "",
      image: NO_IMAGE,
    },
    goalTitles: { ...GOALS },
    spotlight: {
      link: { type: "category", value: DEFAULT_SPOTLIGHT.slug },
      eyebrow: spotCat?.name ?? "",
      title: DEFAULT_SPOTLIGHT.title,
      description: "",
      buttonText: spotCat ? `Shop ${spotCat.name.toLowerCase()}` : "",
      product: bySlug.get(HERO_PACKS[0].slug)?._id ?? "",
      image: NO_IMAGE,
    },
  };
}

/** Product picker over every active product (A–Z). */
function ProductSelect({ value, onChange, products, placeholder = "Choose a product", ...rest }) {
  return (
    <Select {...rest} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {products.map((p) => (
        <option key={p._id} value={p._id}>
          {p.name}
          {p.inStock ? "" : " — out of stock"}
        </option>
      ))}
    </Select>
  );
}

/** "Auto cut-out from the product photo" or an uploaded image, with upload/remove. */
function ImageChoice({ image, onChange, auto = "Automatic cut-out of the product photo" }) {
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const { image: uploaded } = await uploadImage(file);
      onChange(uploaded);
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 text-small">
      {image?.url ? (
        <>
          <img
            src={image.url}
            alt=""
            className="size-12 rounded-md border border-line bg-night object-contain"
          />
          <span className="font-semibold">Your image</span>
          <button
            type="button"
            onClick={() => onChange(NO_IMAGE)}
            className="inline-flex items-center gap-1 text-danger underline"
          >
            <Trash2 aria-hidden="true" className="size-4" /> Use automatic
          </button>
        </>
      ) : (
        <span className="rounded-full bg-shelf px-2.5 py-1 font-semibold text-ink-2">{auto}</span>
      )}
      <label className="inline-flex cursor-pointer items-center gap-1.5 font-semibold underline">
        <ImagePlus aria-hidden="true" className="size-4" />
        {busy ? "Uploading…" : image?.url ? "Replace" : "Upload your own"}
        <input
          type="file"
          accept="image/png,image/webp,image/jpeg"
          className="sr-only"
          disabled={busy}
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}

/** Where a card or button goes. */
function LinkChoice({
  link,
  onChange,
  categories,
  brands,
  productLabel = "This product's page",
  id,
}) {
  const set = (patch) => onChange({ ...link, ...patch });
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Select
        id={id}
        aria-label="Opens"
        value={link.type}
        onChange={(e) => set({ type: e.target.value, value: "" })}
      >
        {productLabel && <option value="product">{productLabel}</option>}
        <option value="category">A category…</option>
        <option value="brand">A brand…</option>
        <option value="custom">Custom link…</option>
      </Select>
      {link.type === "category" && (
        <Select
          aria-label="Category"
          value={link.value}
          onChange={(e) => set({ value: e.target.value })}
        >
          <option value="">Choose a category</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      )}
      {link.type === "brand" && (
        <Select
          aria-label="Brand"
          value={link.value}
          onChange={(e) => set({ value: e.target.value })}
        >
          <option value="">Choose a brand</option>
          {brands.map((b) => (
            <option key={b._id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </Select>
      )}
      {link.type === "custom" && (
        <Input
          aria-label="Custom link"
          placeholder="/shop?sort=newest or https://…"
          value={link.value}
          onChange={(e) => set({ value: e.target.value })}
        />
      )}
    </div>
  );
}

/**
 * Admin → Homepage content: the hero's rotating products, the Shop all menu's featured product,
 * the big Shop by goal tile (and the other tiles' goal titles) and the spotlight band after
 * Best sellers. Opens with today's homepage the first time, so nothing changes until you save.
 */
export default function AdminHomepagePage() {
  const content = useQuery({
    queryKey: adminKeys.homepage,
    queryFn: ({ signal }) => fetchHomepageContent({ signal }),
    ...adminQuery,
  });
  const products = useQuery({
    queryKey: adminKeys.products({ picker: true }),
    queryFn: ({ signal }) =>
      fetchAdminProducts({ page: 1, limit: 100, status: "active" }, { signal }),
    ...adminQuery,
    staleTime: 5 * 60_000,
  });
  const taxonomy = useTaxonomy();

  const failed = content.error || products.error;
  if (failed) {
    return (
      <ErrorState
        error={failed}
        onRetry={() => {
          content.refetch();
          products.refetch();
        }}
      />
    );
  }
  if (content.isPending || products.isPending || taxonomy.isPending) {
    return <Skeleton className="h-[600px] max-w-6xl" />;
  }
  return (
    <HomepageForm
      key={content.data?.version ?? 0}
      saved={content.data}
      productItems={products.data?.items ?? []}
      categories={taxonomy.categories}
      brands={taxonomy.brands}
    />
  );
}

function HomepageForm({ saved, productItems, categories, brands }) {
  const queryClient = useQueryClient();
  const products = useMemo(
    () =>
      productItems
        .map((p) => ({
          _id: p._id,
          name: p.name,
          slug: p.slug,
          brand: p.brand?.name ?? "",
          photo: variantImage(p.variants?.find((v) => v.isDefault) ?? p.variants?.[0])?.url ?? null,
          inStock: (p.variants ?? []).some(isPurchasable),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [productItems],
  );
  const byId = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);
  const isNew = !saved?.version;
  const [draft, setDraft] = useState(() =>
    isNew ? fromBuiltIn(productItems, categories) : fromSaved(saved),
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (part, patch) => {
    setDraft((d) => ({ ...d, [part]: { ...d[part], ...patch } }));
    setDirty(true);
  };
  const setHero = (hero) => {
    setDraft((d) => ({ ...d, hero }));
    setDirty(true);
  };
  const heroItem = (i, patch) =>
    setHero(draft.hero.map((h, k) => (k === i ? { ...h, ...patch } : h)));
  const moveHero = (i, step) => {
    const next = [...draft.hero];
    const j = i + step;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setHero(next);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await saveHomepageContent(draft);
      queryClient.setQueryData(adminKeys.homepage, result);
      notify.success("Homepage saved — live on the store within a minute");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const otherGoals = categories.filter((c) => c._id !== draft.goalTile.category);

  return (
    <div className="max-w-6xl pb-28">
      <AdminHeader
        title="Homepage content"
        description="What shows in the hero, the Shop all menu, Shop by goal and the spotlight band. Changes go live when you save."
        actions={
          <Button
            href="/"
            target="_blank"
            rel="noopener"
            variant="outline"
            size="sm"
            leadingIcon={<ExternalLink aria-hidden="true" className="size-4" />}
          >
            View homepage
          </Button>
        }
      />
      {isNew && (
        <p className="-mt-3 mb-5 rounded-md bg-shelf px-4 py-3 text-small text-ink-2">
          This is what your homepage shows today. Change anything and press Save.
        </p>
      )}

      <div className="flex flex-col gap-6">
        <Panel title="1 · Hero — rotating products">
          <p className="mb-4 text-small text-ink-3">
            Shown in this order, one at the front every 2.5 s; the first one loads first. Out of
            stock products hide themselves until they're back. The product photo's background is
            removed automatically (the first view of a new product takes a few seconds) — or upload
            your own transparent PNG.
          </p>
          <ol className="flex flex-col gap-3">
            {draft.hero.map((h, i) => {
              const p = byId.get(h.product);
              return (
                <li key={`${h.product}-${i}`} className="rounded-card border border-line bg-paper">
                  <div className="flex flex-wrap items-center gap-3 p-3">
                    {p?.photo ? (
                      <img
                        src={p.photo}
                        alt=""
                        className="size-12 rounded-md border border-line bg-surface object-contain"
                      />
                    ) : (
                      <span className="size-12 rounded-md bg-shelf" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {p?.name ?? "Product hidden or deleted"}
                      </p>
                      <p
                        className={
                          p?.inStock ? "text-small text-ink-3" : "text-small text-brand-ink"
                        }
                      >
                        {p
                          ? p.inStock
                            ? `${p.brand} · In stock`
                            : "Out of stock — hidden for now"
                          : "Won't show"}
                        {i === 0 && " · Shown first"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Move ${p?.name ?? "product"} up`}
                        disabled={i === 0}
                        onClick={() => moveHero(i, -1)}
                      >
                        <ArrowUp aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Move ${p?.name ?? "product"} down`}
                        disabled={i === draft.hero.length - 1}
                        onClick={() => moveHero(i, 1)}
                      >
                        <ArrowDown aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${p?.name ?? "product"} from the hero`}
                        onClick={() => setHero(draft.hero.filter((_, k) => k !== i))}
                      >
                        <X aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 border-t border-line p-3 md:grid-cols-3">
                    <Field label="Small line on the card" hint={`Empty = ${p?.brand || "brand"}`}>
                      {(f) => (
                        <Input
                          {...f}
                          maxLength={40}
                          value={h.eyebrow}
                          onChange={(e) => heroItem(i, { eyebrow: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Title on the card" hint="Empty = product name">
                      {(f) => (
                        <Input
                          {...f}
                          maxLength={60}
                          value={h.title}
                          onChange={(e) => heroItem(i, { title: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Clicking it opens">
                      {(f) => (
                        <LinkChoice
                          id={f.id}
                          link={h.link}
                          categories={categories}
                          brands={brands}
                          onChange={(link) => heroItem(i, { link })}
                        />
                      )}
                    </Field>
                    <div className="md:col-span-3">
                      <ImageChoice image={h.image} onChange={(image) => heroItem(i, { image })} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {draft.hero.length < MAX_HERO ? (
            <div className="mt-4 max-w-md">
              <Field label="Add a product to the hero">
                {(f) => (
                  <ProductSelect
                    {...f}
                    value=""
                    products={products.filter((p) => !draft.hero.some((h) => h.product === p._id))}
                    placeholder="Choose a product to add"
                    onChange={(id) =>
                      id &&
                      setHero([
                        ...draft.hero,
                        {
                          product: id,
                          eyebrow: "",
                          title: "",
                          link: { type: "product", value: "" },
                          image: NO_IMAGE,
                        },
                      ])
                    }
                  />
                )}
              </Field>
            </div>
          ) : (
            <p className="mt-4 text-small text-ink-3">The hero holds up to {MAX_HERO} products.</p>
          )}
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="2 · Shop all menu — featured product">
            <div className="flex flex-col gap-4">
              <Field label="Product" hint="The dark card on the right of the Shop all menu">
                {(f) => (
                  <ProductSelect
                    {...f}
                    value={draft.menuFeature.product}
                    products={products}
                    onChange={(product) => update("menuFeature", { product })}
                  />
                )}
              </Field>
              <Field label="Title on the card" hint="Empty = product name — keep it short">
                {(f) => (
                  <Input
                    {...f}
                    maxLength={60}
                    value={draft.menuFeature.title}
                    onChange={(e) => update("menuFeature", { title: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Small label" hint="Empty = Featured pick">
                {(f) => (
                  <Input
                    {...f}
                    maxLength={30}
                    value={draft.menuFeature.label}
                    onChange={(e) => update("menuFeature", { label: e.target.value })}
                  />
                )}
              </Field>
              <ImageChoice
                image={draft.menuFeature.image}
                onChange={(image) => update("menuFeature", { image })}
              />
            </div>
          </Panel>

          <Panel title="4 · Spotlight band — after Best sellers">
            <div className="flex flex-col gap-4">
              <Field label="Button opens">
                {(f) => (
                  <LinkChoice
                    id={f.id}
                    link={draft.spotlight.link}
                    categories={categories}
                    brands={brands}
                    productLabel={draft.spotlight.product ? "The product below" : null}
                    onChange={(link) => update("spotlight", { link })}
                  />
                )}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Small label">
                  {(f) => (
                    <Input
                      {...f}
                      maxLength={40}
                      value={draft.spotlight.eyebrow}
                      onChange={(e) => update("spotlight", { eyebrow: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Button text">
                  {(f) => (
                    <Input
                      {...f}
                      maxLength={40}
                      value={draft.spotlight.buttonText}
                      onChange={(e) => update("spotlight", { buttonText: e.target.value })}
                    />
                  )}
                </Field>
              </div>
              <Field label="Headline" required>
                {(f) => (
                  <Input
                    {...f}
                    maxLength={80}
                    value={draft.spotlight.title}
                    onChange={(e) => update("spotlight", { title: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Description">
                {(f) => (
                  <Textarea
                    {...f}
                    rows={3}
                    maxLength={300}
                    value={draft.spotlight.description}
                    onChange={(e) => update("spotlight", { description: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Image from product">
                {(f) => (
                  <ProductSelect
                    {...f}
                    value={draft.spotlight.product}
                    products={products}
                    placeholder="No product"
                    onChange={(product) => update("spotlight", { product })}
                  />
                )}
              </Field>
              <ImageChoice
                image={draft.spotlight.image}
                onChange={(image) => update("spotlight", { image })}
              />
            </div>
          </Panel>
        </div>

        <Panel title="3 · Shop by goal">
          <p className="mb-4 text-small text-ink-3">
            The big dark tile is set here. The smaller tiles use each category's image and
            description from Catalog → Categories — only their goal titles are set here.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Field label="Big tile category">
                {(f) => (
                  <Select
                    {...f}
                    value={draft.goalTile.category}
                    onChange={(e) => update("goalTile", { category: e.target.value })}
                  >
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Goal title">
                {(f) => (
                  <Input
                    {...f}
                    maxLength={40}
                    value={draft.goalTile.title}
                    onChange={(e) => update("goalTile", { title: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Description" hint="Empty = the category's own description">
                {(f) => (
                  <Textarea
                    {...f}
                    rows={3}
                    maxLength={200}
                    value={draft.goalTile.description}
                    onChange={(e) => update("goalTile", { description: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Button text" hint="Empty = Shop [category]">
                {(f) => (
                  <Input
                    {...f}
                    maxLength={40}
                    value={draft.goalTile.buttonText}
                    onChange={(e) => update("goalTile", { buttonText: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Image from product">
                {(f) => (
                  <ProductSelect
                    {...f}
                    value={draft.goalTile.product}
                    products={products}
                    placeholder="No product"
                    onChange={(product) => update("goalTile", { product })}
                  />
                )}
              </Field>
              <ImageChoice
                image={draft.goalTile.image}
                onChange={(image) => update("goalTile", { image })}
              />
            </div>
            <div>
              <p className="mb-2 text-small font-semibold">Other tiles — goal titles</p>
              <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-2">
                {otherGoals.map((c) => (
                  <label key={c._id} className="contents">
                    <span className="text-small">{c.name}</span>
                    <Input
                      maxLength={40}
                      placeholder={GOALS[c.slug] ?? c.name}
                      value={draft.goalTitles[c.slug] ?? ""}
                      onChange={(e) => update("goalTitles", { [c.slug]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm lg:left-(--admin-sidebar)">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="text-small text-ink-2" role="status">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : dirty ? (
              "Unsaved changes"
            ) : (
              "All changes saved"
            )}
          </p>
          <Button onClick={save} loading={saving} disabled={!dirty && !isNew}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
