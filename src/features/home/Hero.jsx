import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/cn";
import { usePrefersReducedMotion } from "../../lib/useMediaQuery";
import { cutoutSrc, HERO_PACKS, LEAD_INDEX } from "./hero-packs";

const INTERVAL = 3500;
const COUNT = HERO_PACKS.length;

/**
 * Slot by distance from the front pack: horizontal offset (share of the stage width), scale,
 * stacking and brightness. Packs behind shrink and darken, which reads as depth.
 */
const SLOTS = {
  0: { x: 0, s: 1, z: 10, b: 1 },
  1: { x: 26, s: 0.64, z: 6, b: 0.5 },
  [-1]: { x: -26, s: 0.64, z: 6, b: 0.5 },
  2: { x: 40, s: 0.46, z: 3, b: 0.3 },
  [-2]: { x: -40, s: 0.46, z: 3, b: 0.3 },
};

/** Signed distance from the front, wrapping round (e.g. -2…2 for five packs). */
const offset = (k, active) => {
  let d = (k - active + COUNT) % COUNT;
  if (d > COUNT / 2) d -= COUNT;
  return d;
};

/**
 * Homepage hero: copy on the left, a rotating stage of real packshots on the right. Every
 * 3.5 s the next pack rolls to the front (full size, full colour) while the others step back.
 * Hover pauses it; clicking a pack or a dot brings that one forward; phones swipe. With
 * reduced motion it only changes when tapped. Static markup and no API call, so it paints
 * with the first frame; the front pack is the LCP image.
 *
 * @param {{ brandCount?: number }} props
 */
export function Hero({ brandCount }) {
  const [active, setActive] = useState(LEAD_INDEX);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const touchX = useRef(null);

  useEffect(() => {
    if (paused || reduced) return undefined;
    const id = window.setInterval(() => setActive((i) => (i + 1) % COUNT), INTERVAL);
    return () => window.clearInterval(id);
  }, [paused, reduced]);

  // Background tabs don't need to spin.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const go = (i) => setActive(((i % COUNT) + COUNT) % COUNT);
  const front = HERO_PACKS[active];

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-night-deep text-night-text"
      style={{
        backgroundImage:
          "radial-gradient(60% 70% at 74% 62%, rgb(243 107 39 / 0.26) 0%, rgb(243 107 39 / 0) 62%), linear-gradient(180deg, #141414 0%, #0b0b0b 100%)",
      }}
    >
      <div className="page-container grid gap-6 pt-9 lg:min-h-[620px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10 lg:py-12">
        <div>
          <p className="label-caps text-brand motion-safe:animate-[fade-up_700ms_var(--ease-out-soft)_both]">
            Authentic sports nutrition · Karachi
          </p>
          <h1
            id="hero-title"
            className="mt-4 text-[3.5rem] font-display md:text-[5rem] xl:text-[6.25rem] 2xl:text-[7rem]"
          >
            Train hard.
            <br />
            <span className="text-brand">Fuel genuine.</span>
          </h1>
          <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-night-muted motion-safe:animate-[fade-up_700ms_var(--ease-out-soft)_both] motion-safe:[animation-delay:140ms] lg:text-[19px]">
            Whey, creatine, pre-workout and mass gainers from{" "}
            {brandCount ? `${brandCount} trusted brands` : "trusted brands"} — sourced, never
            repacked. Cash on delivery anywhere in Pakistan.
          </p>
          <div className="mt-7 grid gap-3 motion-safe:animate-[fade-up_700ms_var(--ease-out-soft)_both] motion-safe:[animation-delay:240ms] sm:flex">
            <Button
              to="/shop?sort=bestselling"
              size="lg"
              trailingIcon={<ArrowRight aria-hidden="true" className="size-4.5" />}
            >
              Shop best sellers
            </Button>
            <Button href="#goals" size="lg" variant="onDark">
              Shop by goal
            </Button>
          </div>
          <dl className="mt-9 hidden max-w-md grid-cols-3 gap-6 border-t border-night-line pt-6 motion-safe:animate-[fade-up_700ms_var(--ease-out-soft)_both] motion-safe:[animation-delay:340ms] sm:grid">
            {[
              [brandCount ? String(brandCount) : "Top", "trusted brands"],
              ["COD", "pay when it arrives"],
              ["KHI", "same-day delivery"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse gap-1">
                <dt className="text-[13px] text-night-muted">{label}</dt>
                <dd className="text-[2.5rem] font-display text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured products"
          onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            if (start == null) return;
            const dx = e.changedTouches[0].clientX - start;
            if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
          }}
          className="[container-type:inline-size] relative h-[330px] sm:h-[400px] lg:h-[580px]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-[8%] bottom-[30px] h-16 rounded-[50%] bg-black/70 blur-md"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-[46px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />

          {HERO_PACKS.map((pack, k) => {
            const d = offset(k, active);
            const slot = SLOTS[d];
            const isFront = d === 0;
            return (
              <Link
                key={pack.id}
                to={`/product/${pack.slug}`}
                aria-label={pack.name}
                tabIndex={isFront ? 0 : -1}
                onClick={(e) => {
                  // A back pack is first brought forward; the front one opens its product.
                  if (!isFront) {
                    e.preventDefault();
                    go(k);
                  }
                }}
                style={{
                  aspectRatio: pack.w,
                  transform: `translateX(calc(-50% + ${slot.x}cqw)) scale(${slot.s})`,
                  zIndex: slot.z,
                  filter: `brightness(${slot.b})${isFront ? " drop-shadow(0 30px 40px rgb(0 0 0 / 0.6))" : ""}`,
                }}
                className="absolute bottom-[46px] left-1/2 block h-[74%] origin-bottom transition-[transform,filter] duration-[800ms] ease-(--ease-out-soft)"
              >
                <picture>
                  <source media="(min-width: 1024px)" srcSet={cutoutSrc(pack.id, 640)} />
                  <img
                    src={cutoutSrc(pack.id, 400)}
                    alt=""
                    className="block size-full object-contain"
                    fetchPriority={pack.lead ? "high" : "auto"}
                    decoding={pack.lead ? "sync" : "async"}
                  />
                </picture>
              </Link>
            );
          })}

          <Link
            to={`/product/${front.slug}`}
            aria-live="polite"
            className="absolute top-2 right-0 z-20 hidden items-center gap-3 rounded-card bg-night/85 px-4 py-3 ring-1 ring-night-line backdrop-blur-sm transition-colors hover:ring-brand lg:flex"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-brand ring-4 ring-brand/25"
            />
            <span className="flex flex-col">
              <span className="text-[12px] text-night-muted">{front.brand}</span>
              <span className="text-small font-bold text-white">{front.short}</span>
            </span>
            <span className="ml-2 flex items-center gap-1 text-small font-bold text-brand">
              Shop now <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </Link>

          <div className="absolute inset-x-0 bottom-1 z-20 flex justify-center gap-1.5">
            {HERO_PACKS.map((pack, k) => (
              <button
                key={pack.id}
                type="button"
                aria-label={`Show ${pack.name}`}
                aria-current={k === active}
                onClick={() => go(k)}
                className="flex h-6 items-center"
              >
                <span
                  className={cn(
                    "block h-2 rounded-full transition-[width,background-color] duration-300",
                    k === active ? "w-7 bg-brand" : "w-2 bg-night-muted/50 hover:bg-night-muted",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
