import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { usePrefersReducedMotion } from "../../lib/useMediaQuery";
import { heroPacks } from "./hero-packs";
import { useHomepageContent } from "./useHomepageContent";

const INTERVAL = 2500;
/** A horizontal drag/swipe longer than this (px) moves to the next or previous pack. */
const SWIPE = 40;

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
/** Packs further back (6–8 packs) wait out of sight behind the others. */
const slotFor = (d) => SLOTS[d] ?? { x: Math.sign(d) * 44, s: 0.36, z: 1, b: 0.2, hidden: true };

/** Signed distance from the front, wrapping round (e.g. -2…2 for five packs). */
const offset = (k, active, count) => {
  let d = (k - active + count) % count;
  if (d > count / 2) d -= count;
  return d;
};

/** Internal links use the router; a custom https link opens in a new tab. */
const linkProps = (href) =>
  href.startsWith("/")
    ? { as: Link, to: href }
    : { as: "a", href, target: "_blank", rel: "noopener" };

/**
 * Homepage hero: copy on the left, a rotating stage of real packshots on the right. Every
 * 2.5 s the next pack rolls to the front (full size, full colour) while the others step back.
 * Hover pauses it. Swipe (touch) or drag (mouse) left/right to move; arrow keys work when it's
 * focused; clicking a back pack brings it forward, the front one opens its link. With
 * reduced motion it only changes when moved by hand. The packs come from Admin → Homepage
 * content (remembered between visits); the built-in ones show until that has loaded, so the
 * hero paints with the first frame and the front pack is the LCP image.
 *
 * @param {{ brandCount?: number }} props
 */
export function Hero({ brandCount }) {
  const content = useHomepageContent().data;
  const packs = useMemo(() => heroPacks(content), [content]);
  const count = packs.length;
  const [picked, setActive] = useState(() =>
    Math.max(
      0,
      packs.findIndex((p) => p.lead),
    ),
  );
  const active = picked % count;
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  // Pointer drag in progress ({ x, moved }), and whether the click that ends a drag should be
  // swallowed so dragging a pack never opens its product.
  const drag = useRef(null);
  const swallowClick = useRef(false);

  useEffect(() => {
    if (paused || reduced) return undefined;
    const id = window.setInterval(() => setActive((i) => (i + 1) % count), INTERVAL);
    return () => window.clearInterval(id);
  }, [paused, reduced, count]);

  // Background tabs don't need to spin.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const go = (i) => setActive(((i % count) + count) % count);
  const front = packs[active];
  const { as: FrontLink, ...frontLink } = linkProps(front.href);

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

        {/* Drag, swipe and arrow keys are shortcuts on top of the real controls (the pack links
            inside), so the region itself carries the handlers. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured products"
          onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(active + 1);
            else if (e.key === "ArrowLeft") go(active - 1);
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            drag.current = { x: e.clientX, moved: false };
          }}
          onPointerMove={(e) => {
            if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true;
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            if (!d) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > SWIPE) go(active + (dx < 0 ? 1 : -1));
            if (d.moved) swallowClick.current = true;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onClickCapture={(e) => {
            if (!swallowClick.current) return;
            swallowClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }}
          // pan-y: the page still scrolls vertically, horizontal moves come to us as a drag.
          className="[container-type:inline-size] relative h-[330px] cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-[400px] lg:h-[580px]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-[8%] bottom-[30px] h-16 rounded-[50%] bg-black/70 blur-md"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-[46px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />

          {packs.map((pack, k) => {
            const d = offset(k, active, count);
            const slot = slotFor(d);
            const isFront = d === 0;
            const { as: PackLink, ...packLink } = linkProps(pack.href);
            return (
              <PackLink
                key={pack.key}
                {...packLink}
                aria-label={pack.name}
                aria-hidden={slot.hidden || undefined}
                tabIndex={isFront ? 0 : -1}
                draggable={false}
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
                  opacity: slot.hidden ? 0 : 1,
                  filter: `brightness(${slot.b})${isFront ? " drop-shadow(0 30px 40px rgb(0 0 0 / 0.6))" : ""}`,
                }}
                className="absolute bottom-[46px] left-1/2 block h-[74%] origin-bottom transition-[transform,filter,opacity] duration-[650ms] ease-(--ease-out-soft)"
              >
                <picture>
                  <source media="(min-width: 1024px)" srcSet={pack.src(640)} />
                  <img
                    src={pack.src(400)}
                    alt=""
                    draggable={false}
                    className="block size-full object-contain"
                    fetchPriority={pack.lead ? "high" : "auto"}
                    decoding={pack.lead ? "sync" : "async"}
                  />
                </picture>
              </PackLink>
            );
          })}

          <FrontLink
            {...frontLink}
            aria-live="polite"
            className="absolute top-2 right-0 z-20 hidden items-center gap-3 rounded-card bg-night/85 px-4 py-3 ring-1 ring-night-line backdrop-blur-sm transition-colors hover:ring-brand lg:flex"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-brand ring-4 ring-brand/25"
            />
            <span className="flex flex-col">
              <span className="text-[12px] text-night-muted">{front.eyebrow}</span>
              <span className="text-small font-bold text-white">{front.title}</span>
            </span>
            <span className="ml-2 flex items-center gap-1 text-small font-bold text-brand">
              Shop now <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </FrontLink>
        </div>
      </div>
    </section>
  );
}
