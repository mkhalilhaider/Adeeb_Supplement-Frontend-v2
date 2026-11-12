import { useState } from "react";
import { PackageOpen, Search, ShoppingBag } from "lucide-react";
import { ApiError } from "../../lib/api/errors";
import { notify } from "../../lib/notify";
import { Badge, OrderStatusBadge } from "../../components/ui/Badge";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog, Dialog } from "../../components/ui/Dialog";
import { Accordion, Tabs } from "../../components/ui/Disclosure";
import { Field } from "../../components/ui/Field";
import { Checkbox, Input, Select, Textarea } from "../../components/ui/Input";
import { Price } from "../../components/ui/Price";
import { QuantityStepper } from "../../components/ui/QuantityStepper";
import { RadioCards } from "../../components/ui/RadioCards";
import { Rating } from "../../components/ui/Rating";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Sheet } from "../../components/ui/Sheet";
import { SkeletonText } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { ProductCard, ProductCardSkeleton } from "../../features/catalog/components/ProductCard";
import { toProductCard } from "../../features/catalog/lib/product-view";
import { useProducts } from "../../features/catalog/queries";

function Block({ title, children }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="mb-6 label-caps text-ink-3">{title}</h2>
      {children}
    </section>
  );
}

const COLORS = [
  ["paper", "bg-paper"],
  ["surface", "bg-surface"],
  ["shelf", "bg-shelf"],
  ["ink", "bg-ink"],
  ["ink-2", "bg-ink-2"],
  ["ink-3", "bg-ink-3"],
  ["line", "bg-line"],
  ["line-strong", "bg-line-strong"],
  ["brand", "bg-brand"],
  ["brand-ink", "bg-brand-ink"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
  ["night", "bg-night"],
];

/** Development-only catalogue of every UI component and state (not in production builds). */
export default function UiGalleryPage() {
  const [qty, setQty] = useState(2);
  const [address, setAddress] = useState("home");
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [wishlist, setWishlist] = useState(() => new Set());
  const products = useProducts({ sort: "bestselling", limit: 8 });

  return (
    <div className="page-container pb-24">
      <title>UI gallery</title>
      <meta name="robots" content="noindex" />
      <header className="py-10">
        <p className="label-caps text-ink-3">Dev only · Phase 1</p>
        <h1 className="mt-2 text-display font-extrabold uppercase font-condensed md:text-6xl">
          Design system
        </h1>
      </header>

      <Block title="Colour tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {COLORS.map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <span className={`h-14 rounded-sm border border-line ${cls}`} />
              <span className="label-caps text-ink-2">{name}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Typography">
        <p className="text-display font-extrabold uppercase font-condensed md:text-7xl">
          Display 72
        </p>
        <p className="mt-3 text-h1 font-extrabold uppercase font-condensed md:text-5xl">
          Heading 1
        </p>
        <p className="mt-3 text-h2 font-bold">Heading 2 — Archivo bold</p>
        <p className="mt-2 text-h3 font-semibold">Heading 3 — semibold</p>
        <p className="mt-2 max-w-prose">
          Body 16/26. Gold Standard 100% Whey delivers 24g of protein per serving. Cash on delivery
          across Pakistan.
        </p>
        <p className="mt-2 text-small text-ink-2">Small 14 — secondary text</p>
        <p className="mt-2 label-caps text-ink-3">
          Label mono · 5 lbs · 74 servings · SKU ADEEB-123
        </p>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Add to cart</Button>
          <Button variant="secondary">Checkout</Button>
          <Button variant="outline">Browse brands</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="link">View all</Button>
          <Button variant="danger">Delete</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg" leadingIcon={<ShoppingBag aria-hidden="true" className="size-5" />}>
            Large with icon
          </Button>
          <Button loading>Placing order</Button>
          <Button disabled>Disabled</Button>
          <IconButton label="Search">
            <Search aria-hidden="true" className="size-5" />
          </IconButton>
          <IconButton label="Search" variant="outline">
            <Search aria-hidden="true" className="size-5" />
          </IconButton>
        </div>
      </Block>

      <Block title="Form controls">
        <div className="grid max-w-3xl gap-5 md:grid-cols-2">
          <Field label="Full name" required hint="As it appears on your ID card">
            {(f) => <Input {...f} placeholder="Ali Khan" autoComplete="name" />}
          </Field>
          <Field label="Phone" required error="Enter a Pakistani mobile number, e.g. 0300 1234567">
            {(f) => <Input {...f} defaultValue="0300" inputMode="tel" leading="+92" />}
          </Field>
          <Field label="City" required>
            {(f) => (
              <Select {...f} defaultValue="Karachi">
                <option>Karachi</option>
                <option>Lahore</option>
                <option>Islamabad</option>
              </Select>
            )}
          </Field>
          <Field label="Disabled">
            {(f) => <Input {...f} disabled value="Can't edit" readOnly />}
          </Field>
          <Field label="Order notes" className="md:col-span-2">
            {(f) => <Textarea {...f} placeholder="Landmark, delivery time…" />}
          </Field>
          <Checkbox
            id="g-save"
            label="Save this address"
            description="Use it for faster checkout"
          />
          <div className="flex items-center gap-4">
            <QuantityStepper value={qty} onChange={setQty} max={5} />
            <QuantityStepper value={1} onChange={() => {}} size="sm" max={1} />
          </div>
          <RadioCards
            className="md:col-span-2"
            columns={2}
            label="Delivery address"
            value={address}
            onValueChange={setAddress}
            options={[
              {
                value: "home",
                title: "Home",
                description: "House 12, Block 13A, Gulshan-e-Iqbal, Karachi",
              },
              {
                value: "office",
                title: "Office",
                description: "Shahrah-e-Faisal, Karachi",
                aside: "Default",
              },
            ]}
          />
        </div>
      </Block>

      <Block title="Badges, price, rating">
        <div className="flex flex-wrap gap-2">
          <Badge tone="sale">−8%</Badge>
          <Badge tone="warning">Only 3 left</Badge>
          <Badge tone="danger">Sold out</Badge>
          <Badge tone="success">In stock</Badge>
          <Badge tone="ink">New</Badge>
          <Badge>Info</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
            <OrderStatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-8">
          <Price price={9000} salePrice={8200} size="lg" showSaving />
          <Price price={45000} />
          <Price price={5000} salePrice={4500} from size="sm" />
          <Rating value={4.4} count={5} showValue />
          <Rating value={3.5} count={12} size={18} />
        </div>
      </Block>

      <Block title="Headings & navigation">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Protein", to: "/category/protein" },
            { label: "Gold Standard Whey" },
          ]}
        />
        <SectionHeading
          className="mt-6"
          index={1}
          eyebrow="Ranked by real sales"
          title="Best sellers"
          action={{ label: "View all", to: "/shop" }}
        />
      </Block>

      <Block title="Product cards — live data from the local API">
        {products.isError ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} compact />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {products.isPending
              ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)
              : products.data.items.map((p, i) => {
                  const card = toProductCard(p);
                  return (
                    <ProductCard
                      key={card.id}
                      card={card}
                      priority={i < 2}
                      wishlisted={wishlist.has(card.id)}
                      onToggleWishlist={(c) =>
                        setWishlist((prev) => {
                          const next = new Set(prev);
                          next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                          return next;
                        })
                      }
                      onQuickAdd={(c) =>
                        notify.success(
                          c.quickAddVariantId
                            ? "Added to cart"
                            : "Opens the variant picker (Phase 4)",
                        )
                      }
                    />
                  );
                })}
          </div>
        )}
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <ProductCardSkeleton />
          <div role="status" className="flex flex-col justify-center">
            <span className="sr-only">Loading</span>
            <SkeletonText lines={4} />
          </div>
        </div>
      </Block>

      <Block title="Empty & error states">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            icon={PackageOpen}
            title="No products match these filters"
            description="Try removing a filter or searching for something else."
            action={<Button variant="outline">Clear filters</Button>}
            className="rounded-md border border-line"
          />
          <ErrorState
            error={new ApiError("network", { kind: "network" })}
            onRetry={() => {}}
            className="rounded-md border border-line"
          />
          <ErrorState
            error={
              new ApiError("Something went wrong on our side. Please try again.", { status: 500 })
            }
            onRetry={() => {}}
            compact
          />
        </div>
      </Block>

      <Block title="Overlays & feedback">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setDialog(true)}>
            Open dialog
          </Button>
          <Button variant="outline" onClick={() => setConfirm(true)}>
            Confirm dialog
          </Button>
          <Button variant="outline" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
          <Button variant="outline" onClick={() => notify.success("Added to cart")}>
            Success toast
          </Button>
          <Button
            variant="outline"
            onClick={() => notify.error(new ApiError("Only 3 item(s) available", { status: 409 }))}
          >
            Error toast
          </Button>
          <Button
            variant="outline"
            onClick={() => notify.undoable("Removed from cart", () => notify.info("Restored"))}
          >
            Undo toast
          </Button>
        </div>
        <Dialog
          open={dialog}
          onOpenChange={setDialog}
          title="Delivery charges"
          description="Fees are set by the store."
          footer={<Button onClick={() => setDialog(false)}>Got it</Button>}
        >
          <p>Karachi: local rider. Other cities: nationwide courier. Free above the threshold.</p>
        </Dialog>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Cancel this order?"
          description="Stock goes back on the shelf. This can't be undone."
          confirmLabel="Cancel order"
          cancelLabel="Keep order"
          onConfirm={() => setConfirm(false)}
        />
        <Sheet
          open={sheet}
          onOpenChange={setSheet}
          title="Filter & sort"
          footer={
            <Button fullWidth onClick={() => setSheet(false)}>
              Show 24 products
            </Button>
          }
        >
          <Accordion
            defaultValue={["category"]}
            items={[
              {
                value: "category",
                title: "Category",
                content: "Protein · Creatine · Pre-workout…",
              },
              { value: "brand", title: "Brand", content: "Optimum Nutrition · Dymatize…" },
              { value: "price", title: "Price", content: "Under Rs 5,000 · Rs 5,000–10,000…" },
            ]}
          />
        </Sheet>
      </Block>

      <Block title="Accordion & tabs">
        <div className="grid gap-10 md:grid-cols-2">
          <Accordion
            type="single"
            items={[
              {
                value: "a",
                title: "Is cash on delivery available?",
                content: "Yes, everywhere in Pakistan.",
              },
              {
                value: "b",
                title: "How long does delivery take?",
                content: "Karachi riders are fastest; other cities by courier.",
              },
            ]}
          />
          <Tabs
            label="Product information"
            tabs={[
              {
                value: "d",
                label: "Description",
                content: "Plain-text description from the product.",
              },
              {
                value: "r",
                label: "Reviews (5)",
                content: "Reviews load when this section is reached.",
              },
              { value: "s", label: "Delivery", content: "COD · Nationwide · Karachi store." },
            ]}
          />
        </div>
      </Block>
    </div>
  );
}
