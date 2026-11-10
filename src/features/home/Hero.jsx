import { Link } from "react-router";
import { ArrowRight, Banknote, House, ShieldCheck, Truck } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { site } from "../../config/site";
import { cn } from "../../lib/cn";

const CLOUD = "https://res.cloudinary.com/ztiwmftk/image/upload";

/**
 * Real catalog packshots on a "shelf" (approved mockup: design/hero-mockup.html). White padding
 * is trimmed by Cloudinary and the white background disappears with multiply blending, so the
 * tubs stand on the paper-coloured page. `from` hides smaller packs on narrow screens.
 */
const PACKS = [
  {
    id: "qz7bnwkscqumhccxxvh8",
    slug: "kevin-levrone-gold-creatine-unflavored-60-servings-in-pakistan",
    label: "Kevin Levrone · Creatine",
    alt: "Kevin Levrone Gold Creatine tub",
    height: "50%",
    from: "2xl",
  },
  {
    id: "jv4yyhm8touiq3d9ucq8",
    slug: "dymatize-iso100-3-lb-42-servings-hydrolyzed-isolate-protein",
    label: "Dymatize · ISO100",
    alt: "Dymatize ISO100 hydrolyzed whey tub",
    height: "74%",
  },
  {
    id: "j3fvjcuok3csqjt9cp0p",
    slug: "optimum-nutrition-gold-standard-100-whey-5-64-lb-80-servings",
    label: "Optimum Nutrition · Gold Standard",
    alt: "Optimum Nutrition Gold Standard 100% Whey bag",
    height: "100%",
    priority: true,
  },
  {
    id: "zitpb3rfe5gmiv9fzass",
    slug: "c4-original-pre-workout-50-servings",
    label: "Cellucor · C4 Original",
    alt: "Cellucor C4 Original pre-workout tub",
    height: "56%",
  },
  {
    id: "jaotsscwebaoj7yuwjyi",
    slug: "muscletech-nitro-tech-ripped-4lbs",
    label: "MuscleTech · Nitro-Tech",
    alt: "MuscleTech Nitro-Tech Ripped tub",
    height: "66%",
    from: "xl",
  },
];

const packSrc = (id, h) => `${CLOUD}/e_trim:8/f_auto,q_auto,h_${h}/adeeb-supplement/variants/${id}`;

const TRUST_ICONS = { authentic: ShieldCheck, cod: Banknote, delivery: Truck, store: House };

/**
 * Homepage hero: static markup (no API call), so it renders with the first paint. The tallest
 * pack is the LCP image and is fetched with high priority; phones get a smaller rendition.
 *
 * @param {{ brandCount?: number }} props
 */
export function Hero({ brandCount }) {
  return (
    <section
      aria-labelledby="hero-title"
      className={cn(
        "page-container grid gap-7 pt-7 md:pt-10",
        "lg:grid-cols-2 lg:items-center lg:gap-x-8 lg:gap-y-0 lg:pt-12 lg:[grid-template-areas:'copy_stage''trust_stage']",
        "xl:grid-cols-[5fr_7fr] xl:gap-x-10 xl:pt-14",
      )}
    >
      <div className="lg:self-end lg:pb-6 lg:[grid-area:copy]">
        <p className="flex items-center gap-2.5 label-mono text-ink-3 before:h-px before:w-6 before:bg-ink">
          Authentic sports nutrition · Since 2026
        </p>
        <h1
          id="hero-title"
          className="mt-3.5 text-[42px] leading-[0.98] font-extrabold tracking-[-0.005em] uppercase font-condensed md:text-[64px] xl:text-[84px]"
        >
          Genuine supplements.
          <br />
          <span className="text-brand-ink">Delivered</span> across Pakistan.
        </h1>
        <p className="mt-4 max-w-[46ch] leading-relaxed text-ink-2 lg:text-[17px]">
          {brandCount ? `${brandCount} trusted brands` : "Trusted brands"}, from Optimum Nutrition
          to Kevin Levrone. Pay cash on delivery anywhere in Pakistan, or visit our store in
          Karachi.
        </p>
        <div className="mt-5.5 grid gap-2.5 md:flex md:flex-wrap">
          <Button
            to="/shop?sort=bestselling"
            size="lg"
            trailingIcon={<ArrowRight className="size-4.5" />}
          >
            Shop best sellers
          </Button>
          <Button to="/brands" size="lg" variant="outline">
            Browse brands
          </Button>
        </div>
      </div>

      <div className="[container-type:inline-size] lg:[grid-area:stage]">
        <div
          className={cn(
            "relative flex h-[calc(100cqw/2.35)] items-end justify-center gap-[3%]",
            "after:absolute after:inset-x-[-16px] after:bottom-0 after:h-px after:bg-ink lg:after:inset-x-0",
            "xl:h-[calc(100cqw/2.95)] 2xl:h-[calc(100cqw/3.45)]",
          )}
        >
          {PACKS.map((pack) => (
            <Link
              key={pack.id}
              to={`/product/${pack.slug}`}
              aria-label={pack.alt.replace(/ (tub|bag)$/, "")}
              style={{ height: pack.height }}
              className={cn(
                "group relative block flex-none mix-blend-multiply",
                pack.from === "xl" && "hidden xl:block",
                pack.from === "2xl" && "hidden 2xl:block",
              )}
            >
              <picture>
                <source media="(min-width: 1024px)" srcSet={packSrc(pack.id, 640)} />
                <img
                  src={packSrc(pack.id, 400)}
                  alt={pack.alt}
                  className="block h-full w-auto"
                  fetchPriority={pack.priority ? "high" : "auto"}
                  decoding={pack.priority ? "sync" : "async"}
                />
              </picture>
              <span
                aria-hidden="true"
                className="absolute -bottom-7.5 left-1/2 hidden -translate-x-1/2 label-mono whitespace-nowrap text-ink-3 opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100 lg:block"
              >
                {pack.label}
              </span>
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2.5 label-mono text-ink-3 lg:pt-10">
          <span>On the shelf now</span>
          <Link to="/shop" className="border-b border-ink pb-px text-ink">
            All products
          </Link>
        </div>
      </div>

      <ul className="grid grid-cols-2 border-t border-line md:flex md:flex-wrap md:gap-7 lg:grid lg:max-w-[520px] lg:grid-cols-2 lg:gap-x-6 lg:gap-y-0 lg:self-start lg:[grid-area:trust]">
        {site.trust.map((point) => {
          const Icon = TRUST_ICONS[point.id] ?? ShieldCheck;
          return (
            <li
              key={point.id}
              className="flex items-start gap-2.5 py-3 pr-2.5 text-[13px] leading-snug text-ink-2"
            >
              <Icon aria-hidden="true" className="mt-px size-4.5 flex-none text-ink" />
              <span>
                <strong className="block text-[13.5px] font-semibold text-ink">
                  {point.title}
                </strong>
                {point.detail}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
