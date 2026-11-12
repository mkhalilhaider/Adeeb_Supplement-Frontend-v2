import { useRef } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/cn";
import { cutoutSrc, HERO_PACKS, LEAD_PACK } from "./hero-packs";

/**
 * Homepage hero: cinematic charcoal stage with real packshots (cut out by Cloudinary) under a
 * warm orange light. Static markup, no API call, so it renders with the first paint; the centre
 * pack is the LCP image and loads with high priority (phones get the 400px rendition).
 *
 * @param {{ brandCount?: number }} props
 */
export function Hero({ brandCount }) {
  const stageRef = useRef(null);
  const frame = useRef(0);

  // 2.5D stage: with a mouse, packs shift by depth and the light follows the pointer.
  // Touch screens and reduced-motion visitors get the still composition.
  const onPointerMove = (e) => {
    const el = stageRef.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--px", x.toFixed(3));
      el.style.setProperty("--py", y.toFixed(3));
    });
  };
  const onPointerLeave = () => {
    cancelAnimationFrame(frame.current);
    stageRef.current?.style.setProperty("--px", "0");
    stageRef.current?.style.setProperty("--py", "0");
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-night-deep text-night-text"
      style={{
        backgroundImage:
          "radial-gradient(60% 70% at 74% 62%, rgb(243 107 39 / 0.26) 0%, rgb(243 107 39 / 0) 62%), linear-gradient(180deg, #141414 0%, #0b0b0b 100%)",
      }}
    >
      <div className="page-container grid gap-8 pt-9 lg:min-h-[620px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10 lg:py-14">
        <div>
          <p className="label-caps text-brand motion-safe:animate-[fade-up_700ms_var(--ease-out-soft)_both] motion-safe:[animation-delay:0ms]">
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
              ["PK", "nationwide delivery"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse gap-1">
                <dt className="text-[13px] text-night-muted">{label}</dt>
                <dd className="text-[2.5rem] font-display text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          ref={stageRef}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="relative h-[300px] sm:h-[380px] lg:h-[560px]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(closest-side,rgb(243_107_39/0.22),transparent)] transition-transform duration-700 ease-out"
            style={{
              transform: "translate3d(calc(var(--px, 0) * -26px), calc(var(--py, 0) * -18px), 0)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-[8%] bottom-[34px] h-16 rounded-[50%] bg-black/70 blur-md"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-[52px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          <div className="absolute inset-x-0 top-[4%] bottom-[46px]">
            {HERO_PACKS.map((pack, i) => (
              <Link
                key={pack.id}
                to={`/product/${pack.slug}`}
                aria-label={pack.name}
                style={{ height: pack.height, ...pack.place }}
                className={cn(
                  "group absolute bottom-0 block transition-[translate,filter] duration-(--duration-sheet) ease-(--ease-out-soft) hover:-translate-y-1.5",
                  pack.lead ? "z-10" : "z-0",
                  pack.from === "xl" && "hidden xl:block",
                  pack.from === "sm" && "hidden sm:block",
                  !pack.lead && "brightness-[0.88] hover:brightness-100",
                )}
              >
                <span
                  className="block h-full transition-transform duration-500 ease-out motion-safe:animate-[rise_900ms_var(--ease-out-soft)_backwards]"
                  style={{
                    transform: `translate3d(calc(var(--px, 0) * ${pack.lead ? 14 : 7}px), calc(var(--py, 0) * ${pack.lead ? 8 : 4}px), 0)`,
                    animationDelay: `${120 + i * 70}ms`,
                  }}
                >
                  <picture>
                    <source media="(min-width: 1024px)" srcSet={cutoutSrc(pack.id, 640)} />
                    <img
                      src={cutoutSrc(pack.id, 400)}
                      alt=""
                      className={cn(
                        "block h-full w-auto",
                        pack.lead && "drop-shadow-[0_30px_40px_rgb(0_0_0/0.6)]",
                      )}
                      fetchPriority={pack.lead ? "high" : "auto"}
                      decoding={pack.lead ? "sync" : "async"}
                    />
                  </picture>
                  {pack.lead && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
                      style={{
                        maskImage: `url("${cutoutSrc(pack.id, 640)}")`,
                        WebkitMaskImage: `url("${cutoutSrc(pack.id, 640)}")`,
                        maskSize: "100% 100%",
                        WebkitMaskSize: "100% 100%",
                      }}
                    >
                      <span className="absolute inset-y-0 left-0 w-1/2 -translate-x-[130%] bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:animate-[sheen_1400ms_ease-out_1100ms_both]" />
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
          <Link
            to={`/product/${LEAD_PACK.slug}`}
            className="absolute top-0 right-0 hidden items-center gap-3 rounded-card bg-night/85 px-4 py-3 ring-1 ring-night-line backdrop-blur-sm transition-colors hover:ring-brand lg:flex"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-brand ring-4 ring-brand/25"
            />
            <span className="flex flex-col">
              <span className="text-[12px] text-night-muted">{LEAD_PACK.brand}</span>
              <span className="text-small font-bold text-white">{LEAD_PACK.short}</span>
            </span>
            <span className="ml-2 flex items-center gap-1 text-small font-bold text-brand">
              Shop now <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
