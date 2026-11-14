import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { PRICE_PRESETS } from "../../features/catalog/lib/listing-params";
import { contentImageSrc, cutoutSrc, LEAD_PACK } from "../../features/home/hero-packs";
import { useHomepageContent } from "../../features/home/useHomepageContent";

const BRAND_LIMIT = 8;

const heading = "mb-3 label-caps text-ink-3";
const item =
  "-mx-3 flex items-center justify-between rounded-md px-3 py-2 text-[15px] font-semibold text-ink transition-colors hover:bg-shelf";

function priceHref(p) {
  const q = new URLSearchParams();
  if (p.min != null) q.set("min", String(p.min));
  if (p.max != null) q.set("max", String(p.max));
  return `/shop?${q}`;
}

/** Panel of the "Shop all" menu (loaded on demand). Every link comes from cached catalog data. */
export default function ShopMenuPanel({ id, onNavigate }) {
  const { categories, brands } = useTaxonomy();
  const go = () => onNavigate();
  // Featured card: from Admin → Homepage content, else the built-in lead product.
  const set = useHomepageContent().data?.menuFeature;
  const feature = set
    ? { ...set, src: contentImageSrc(set, 400) }
    : {
        href: `/product/${LEAD_PACK.slug}`,
        label: "Featured pick",
        title: LEAD_PACK.short,
        brand: LEAD_PACK.brand,
        src: cutoutSrc(LEAD_PACK.id, 400),
      };

  return (
    <div
      id={id}
      className="absolute inset-x-0 top-full z-40 border-b border-line bg-surface text-ink shadow-overlay motion-safe:animate-[dialog-in_180ms_ease-out]"
    >
      <div className="page-container grid grid-cols-[1fr_1fr_1fr_1.35fr] gap-10 py-8">
        <nav aria-label="Categories">
          <p className={heading}>Categories</p>
          {categories.map((c) => (
            <Link key={c._id} to={`/category/${c.slug}`} onClick={go} className={item}>
              {c.name}
            </Link>
          ))}
          <Link to="/shop" onClick={go} className={`${item} text-brand-ink`}>
            All products <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </nav>

        <nav aria-label="Brands">
          <p className={heading}>Brands</p>
          {brands.slice(0, BRAND_LIMIT).map((b) => (
            <Link key={b._id} to={`/brand/${b.slug}`} onClick={go} className={item}>
              {b.name}
            </Link>
          ))}
          <Link to="/brands" onClick={go} className={`${item} text-brand-ink`}>
            All {brands.length || ""} brands <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </nav>

        <nav aria-label="Collections">
          <p className={heading}>Collections</p>
          <Link to="/shop?sort=bestselling" onClick={go} className={item}>
            Best sellers
          </Link>
          <Link to="/shop?sort=newest" onClick={go} className={item}>
            New arrivals
          </Link>
          <Link to="/shop?featured=1" onClick={go} className={item}>
            Featured picks
          </Link>
          <p className={`${heading} mt-5`}>By price</p>
          {PRICE_PRESETS.map((p) => (
            <Link key={p.id} to={priceHref(p)} onClick={go} className={item}>
              {p.label}
            </Link>
          ))}
        </nav>

        <Link
          to={feature.href}
          onClick={go}
          className="group relative flex min-h-[330px] flex-col justify-end overflow-hidden rounded-card bg-night-deep p-6 text-white"
          style={{
            backgroundImage:
              "radial-gradient(60% 60% at 70% 45%, rgb(243 107 39 / 0.4), rgb(243 107 39 / 0) 70%)",
          }}
        >
          {feature.src && (
            <img
              src={feature.src}
              alt=""
              className="absolute top-6 right-6 h-[58%] w-auto drop-shadow-[0_18px_24px_rgb(0_0_0/0.6)] transition-transform duration-(--duration-sheet) group-hover:scale-[1.04]"
            />
          )}
          <span className="relative label-caps text-brand">{feature.label}</span>
          <span className="relative mt-2 line-clamp-3 max-w-[14ch] text-[2.4rem] font-display leading-[0.95]">
            {feature.title}
          </span>
          <span className="relative mt-3 flex items-center gap-1.5 text-small font-bold">
            {feature.brand ? `${feature.brand} · ` : ""}Shop now{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
