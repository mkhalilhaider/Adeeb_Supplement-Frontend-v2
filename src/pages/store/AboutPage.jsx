import { lazy } from "react";
import { Link } from "react-router";
import { ArrowRight, HeartHandshake, ShieldCheck, Tag } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Button } from "../../components/ui/Button";
import { STORY } from "../../content/story";
import { Odometer } from "../../features/home/Odometer";
import { WhenNear } from "../../features/home/WhenNear";
import { cn } from "../../lib/cn";
import { useInViewOnce } from "../../lib/hooks";
import { usePrefersReducedMotion } from "../../lib/useMediaQuery";

// Below the fold: the store band (and its map) loads as the visitor scrolls toward it.
const StoreBand = lazy(() =>
  import("../../features/home/lower-sections").then((m) => ({ default: m.StoreBand })),
);

const PROMISE_ICONS = { authentic: ShieldCheck, affordable: Tag, trust: HeartHandshake };

/**
 * Entry animation shared with the homepage hero (skipped under reduced motion). Written out
 * in full so Tailwind sees every class.
 */
const FADE_UP = "motion-safe:animate-[fade-up_700ms_var(--ease-out-soft)_both]";
const DELAY = {
  80: "motion-safe:[animation-delay:80ms]",
  180: "motion-safe:[animation-delay:180ms]",
  200: "motion-safe:[animation-delay:200ms]",
  280: "motion-safe:[animation-delay:280ms]",
  380: "motion-safe:[animation-delay:380ms]",
  520: "motion-safe:[animation-delay:520ms]",
};
const fadeUp = (delay) => cn(FADE_UP, DELAY[delay]);

/**
 * Fades its content up the first time it scrolls into view, like the homepage sections. The
 * content is in the page from the start (only its look waits), so nothing shifts or reloads.
 */
function Reveal({ as: Tag = "div", delay = 0, className, children, ...rest }) {
  const [ref, seen] = useInViewOnce({ rootMargin: "0px 0px -12% 0px" });
  return (
    <Tag
      ref={ref}
      data-reveal={seen ? "in" : "out"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Four facts from the story; the numbers roll in like the homepage counters. */
function Facts() {
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInViewOnce({ rootMargin: "0px 0px -10% 0px" });
  const rolled = reduced || seen;
  return (
    <section ref={ref} aria-label="Facts" className="border-b border-line bg-surface">
      <dl className="page-container grid grid-cols-2 lg:grid-cols-4">
        {STORY.facts.map((f, i) => (
          <div
            key={f.value}
            className={cn(
              "group relative flex flex-col gap-1.5 py-6 transition-colors duration-(--duration-base) md:px-7 md:py-8",
              "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-(--duration-base) hover:bg-shelf hover:after:scale-x-100",
              i % 2 ? "border-l border-line pl-5" : "pr-4 md:pl-0 lg:pl-7",
              i > 1 && "border-t border-line lg:border-t-0",
              i === 2 && "lg:border-l",
            )}
          >
            <dt className="order-2 font-extrabold">{f.title}</dt>
            <dd
              className={cn(
                "order-1 text-[3rem] font-display leading-none transition-colors duration-(--duration-base) group-hover:text-brand-ink md:text-[4.5rem]",
                f.to && "text-brand-ink",
              )}
            >
              <span className="sr-only">{f.value}</span>
              <Odometer value={f.value} rolled={rolled} />
            </dd>
            <dd className="order-3 text-small text-ink-3">
              {f.to ? (
                <Link
                  to={f.to}
                  className="inline-flex items-center gap-1 underline-offset-4 hover:text-ink hover:underline"
                >
                  {f.note}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ) : (
                f.note
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * /about — the shop's story in the owner's words: a dark hero with the founder, four facts,
 * the story itself, three promises, the store with its map and a closing call to shop. Same
 * motion as the homepage: the hero fades up on load, sections rise in as they scroll into view.
 */
export default function AboutPage() {
  const [intro, ...rest] = STORY.paragraphs;
  return (
    <div className="flex flex-col gap-16 pb-16 md:gap-24 md:pb-24">
      <Seo
        title="About us"
        description="Adeeb Supplement: authentic supplements at affordable prices for Pakistan, importing genuine products since April 2026."
        canonicalPath="/about"
      />

      <div>
        <section
          aria-labelledby="about-title"
          className="overflow-hidden bg-night-deep text-night-text"
          style={{
            backgroundImage:
              "radial-gradient(55% 70% at 78% 55%, rgb(243 107 39 / 0.22), rgb(243 107 39 / 0) 65%), linear-gradient(180deg, #141414, #0b0b0b)",
          }}
        >
          <div className="page-container grid items-center gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:py-[72px]">
            <div className="flex flex-col gap-6">
              <p className={cn("label-caps text-brand", fadeUp(0))}>{STORY.eyebrow}</p>
              <h1
                id="about-title"
                className="text-[3rem] font-display md:text-[4.5rem] xl:text-[6rem]"
              >
                <span className={cn("block", fadeUp(80))}>Authentic supplements.</span>
                <span className={cn("block text-brand", fadeUp(180))}>Affordable prices.</span>
              </h1>
              <p
                className={cn(
                  "max-w-[560px] text-[18px] leading-relaxed text-night-muted md:text-[20px]",
                  fadeUp(280),
                )}
              >
                {intro}
              </p>
              <div className={cn("grid gap-3 sm:flex", fadeUp(380))}>
                <Button
                  to="/shop"
                  size="lg"
                  trailingIcon={<ArrowRight aria-hidden="true" className="size-4.5" />}
                >
                  Shop now
                </Button>
                <Button href="#visit" size="lg" variant="onDark">
                  Visit the store
                </Button>
              </div>
            </div>

            <figure
              className={cn(
                "group relative mx-auto w-full max-w-[520px] lg:max-w-none",
                fadeUp(200),
              )}
            >
              <div className="aspect-[800/948] overflow-hidden rounded-[20px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] ring-1 ring-white/5 transition-[box-shadow] duration-(--duration-sheet) group-hover:shadow-[0_50px_90px_-30px_rgb(243_107_39/0.45)]">
                <img
                  src="/founder.jpeg"
                  alt={`${STORY.founder.name}, founder of Adeeb Supplement, featured on The Pakistan Stories`}
                  width={800}
                  height={1000}
                  fetchPriority="high"
                  className="block size-full object-cover object-top transition-transform duration-[900ms] ease-(--ease-out-soft) group-hover:scale-[1.04]"
                />
              </div>
              <figcaption
                className={cn(
                  "relative z-10 -mt-5 ml-4 flex max-w-[250px] flex-col gap-1 rounded-[14px] bg-surface px-5 py-4 text-ink shadow-[0_20px_40px_-20px_rgb(0_0_0/0.6)] transition-transform duration-(--duration-sheet) ease-(--ease-out-soft) group-hover:-translate-y-1.5 lg:absolute lg:top-[46%] lg:-left-7 lg:mt-0 lg:ml-0",
                  fadeUp(520),
                )}
              >
                <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.14em] text-brand-ink uppercase">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-brand ring-4 ring-brand/20"
                  />
                  Founder
                </span>
                <b className="text-[18px]">{STORY.founder.name}</b>
                <span className="text-small text-ink-2">{STORY.founder.note}</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <Facts />
      </div>

      <section
        aria-labelledby="story-heading"
        className="page-container grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-[72px]"
      >
        <Reveal className="lg:sticky lg:top-28">
          <p className="label-caps text-brand-ink">How it started</p>
          <h2
            id="story-heading"
            className="mt-3 text-[2.75rem] font-display md:text-[3.5rem] lg:text-[4.5rem]"
          >
            {STORY.title}
          </h2>
          <blockquote className="relative mt-8 border-l-4 border-brand py-1 pl-5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-9 right-0 text-[120px] font-display leading-none text-brand/15"
            >
              “
            </span>
            <p className="relative text-[22px] leading-snug font-bold md:text-[26px]">
              “{STORY.quote}”
            </p>
          </blockquote>
        </Reveal>
        <div className="flex flex-col gap-5 text-[17px] leading-[1.75] text-ink-2 md:text-[18px]">
          {rest.map((p, i) => (
            <Reveal as="p" key={p} delay={i * 80}>
              {p}
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="promises-heading" className="page-container">
        <Reveal>
          <p className="label-caps text-brand-ink">What we stand for</p>
          <h2
            id="promises-heading"
            className="mt-2.5 text-[2.5rem] font-display md:text-[3.25rem] lg:text-[3.75rem]"
          >
            Three promises
          </h2>
        </Reveal>
        <ul className="mt-7 grid gap-4 md:grid-cols-3 md:gap-[18px]">
          {STORY.promises.map((p, i) => {
            const Icon = PROMISE_ICONS[p.id];
            return (
              <Reveal as="li" key={p.id} delay={i * 110}>
                <div className="group relative flex h-full flex-col gap-3.5 overflow-hidden rounded-band border border-line bg-surface p-7 transition-[translate,box-shadow,border-color] duration-(--duration-base) ease-(--ease-out-soft) hover:border-ink/20 md:p-[30px] md:hover:-translate-y-1.5 md:hover:shadow-[0_22px_40px_-18px_rgb(0_0_0/0.28),0_2px_6px_rgb(0_0_0/0.04)]">
                  <span
                    aria-hidden="true"
                    className="absolute top-5 right-6 text-[64px] font-display leading-none text-line transition-colors duration-(--duration-base) group-hover:text-brand/25"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="relative flex size-14 items-center justify-center rounded-[14px] bg-brand/12 text-brand-ink transition-[background-color,color,rotate] duration-(--duration-base) group-hover:-rotate-6 group-hover:bg-brand group-hover:text-ink">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="relative text-[24px] font-extrabold">{p.title}</h3>
                  <p className="relative leading-relaxed text-ink-2">{p.text}</p>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-brand transition-transform duration-(--duration-sheet) ease-(--ease-out-soft) group-hover:scale-x-100"
                  />
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      <div id="visit" className="scroll-mt-24">
        <WhenNear minHeight={300}>
          <StoreBand eyebrow="Come and see us" title="Visit the store in Karachi." />
        </WhenNear>
      </div>

      <Reveal as="section" aria-labelledby="about-cta" className="page-container">
        <div className="group relative flex flex-col gap-8 overflow-hidden rounded-band bg-night px-7 py-10 text-white md:flex-row md:items-center md:justify-between md:p-14">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(243_107_39/0.2),transparent)] transition-transform duration-[900ms] ease-(--ease-out-soft) group-hover:translate-x-16"
          />
          <p
            aria-hidden="true"
            className="pointer-events-none absolute -right-2.5 -bottom-10 text-[140px] font-display leading-none text-transparent transition-[-webkit-text-stroke-color,translate] duration-[900ms] ease-(--ease-out-soft) [-webkit-text-stroke:1.5px_#2a2a2a] group-hover:-translate-x-4 group-hover:[-webkit-text-stroke-color:rgb(243_107_39/0.45)] md:text-[220px]"
          >
            Genuine
          </p>
          <div className="relative">
            <p className="label-caps text-brand">Ready when you are</p>
            <h2 id="about-cta" className="mt-2.5 text-[2.75rem] font-display md:text-[4rem]">
              Train hard.
              <br />
              <span className="text-brand">Fuel genuine.</span>
            </h2>
          </div>
          <div className="relative grid gap-3 sm:flex">
            <Button
              to="/shop"
              size="lg"
              trailingIcon={<ArrowRight aria-hidden="true" className="size-4.5" />}
            >
              Shop now
            </Button>
            <Button to="/refund-policy" size="lg" variant="onDark">
              Read our policies
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
