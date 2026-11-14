import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight, Banknote, House, ShieldCheck, Truck, Zap } from "lucide-react";
import { CloudImage } from "../../components/ui/CloudImage";
import { Skeleton } from "../../components/ui/Skeleton";
import { site } from "../../config/site";
import { cn } from "../../lib/cn";
import { useTaxonomy } from "../catalog/useTaxonomy";
import { contentImageSrc, cutoutSrc, LEAD_PACK } from "./hero-packs";
import { useHomepageContent } from "./useHomepageContent";
import { GOAL_ORDER, GOALS } from "./homepage-defaults";

const TRUST_ICONS = {
  authentic: ShieldCheck,
  sameday: Zap,
  cod: Banknote,
  delivery: Truck,
  store: House,
};

/** The four owner-confirmed promises, right under the hero. */
export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="border-b border-line bg-surface">
      <ul className="page-container grid grid-cols-2 lg:grid-cols-4">
        {site.trust.map((point, i) => {
          const Icon = TRUST_ICONS[point.id] ?? ShieldCheck;
          return (
            <li
              key={point.id}
              className={cn(
                "flex items-center gap-3 py-4 md:py-6",
                i % 2 === 1 && "pl-4 md:pl-7",
                i > 0 && "lg:border-l lg:border-line lg:pl-7",
                i > 1 && "border-t border-line lg:border-t-0",
                point.id === "sameday" && "bg-gradient-to-r from-brand/10 to-transparent",
              )}
            >
              <Icon aria-hidden="true" className="size-6 flex-none text-brand-ink md:size-7" />
              <span className="leading-tight">
                <strong className="block text-small font-extrabold md:text-[15px]">
                  {point.title}
                </strong>
                <span className="text-[13px] text-ink-3">{point.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Each category framed as a customer goal. Goals map one-to-one to real categories (the shop
 * filters by one category at a time); a category without a goal keeps its own name.
 */

export function GoalTiles() {
  const { categories, isPending } = useTaxonomy();
  // Admin → Homepage content: which category gets the big tile, its copy and image, and the
  // goal titles of the other tiles. Built-in values fill anything not set.
  const content = useHomepageContent().data;
  const bigSlug = content?.goalTile?.category ?? null;
  const titles = content?.goalTitles;
  const tiles = useMemo(() => {
    const rank = (slug) => (slug === bigSlug ? -1 : GOAL_ORDER.indexOf(slug) + 1 || 99);
    return [...categories].sort((a, b) => rank(a.slug) - rank(b.slug));
  }, [categories, bigSlug]);
  const goalOf = (c) => titles?.[c.slug] || GOALS[c.slug] || c.name;
  const [lead, ...rest] = tiles;

  return (
    <section id="goals" aria-labelledby="goals-heading" className="page-container scroll-mt-32">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-caps text-brand-ink">Start with your goal</p>
          <h2
            id="goals-heading"
            className="mt-2 text-[2.5rem] font-display md:text-[3.25rem] lg:text-[4rem]"
          >
            Shop by goal
          </h2>
        </div>
        <Link
          to="/shop"
          className="hidden items-center gap-1.5 pb-1 font-bold hover:text-brand-ink sm:inline-flex"
        >
          All products <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {isPending && !tiles.length ? (
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-card md:h-60" />
          ))}
        </div>
      ) : (
        <ul className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-[250px_250px] lg:gap-4">
          {lead && (
            <li className="col-span-2 lg:col-span-1 lg:row-span-2">
              <GoalTile
                category={lead}
                goal={content?.goalTile?.title || goalOf(lead)}
                big={bigSlug === lead.slug ? content.goalTile : {}}
              />
            </li>
          )}
          {rest.map((c) => (
            <li key={c._id}>
              <GoalTile category={c} goal={goalOf(c)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * @param {{ category: any, goal: string, big?: false | { description?: string,
 *   buttonText?: string, image?: string|null, cutout?: string|null } }} props
 */
function GoalTile({ category, goal, big = false }) {
  if (big) {
    const image = contentImageSrc(big, 400) ?? cutoutSrc(LEAD_PACK.id, 400);
    const description = big.description || category.description;
    return (
      <Link
        to={`/category/${category.slug}`}
        className="group relative flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-card bg-night-deep p-5 text-white transition-[translate,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) md:p-7 md:hover:-translate-y-1.5 md:hover:shadow-[0_22px_40px_-16px_rgb(0_0_0/0.45)] lg:min-h-0"
        style={{
          backgroundImage:
            "radial-gradient(70% 55% at 60% 30%, rgb(243 107 39 / 0.35), rgb(243 107 39 / 0) 70%)",
        }}
      >
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute top-5 right-5 h-[38%] w-auto drop-shadow-[0_18px_24px_rgb(0_0_0/0.6)] transition-transform duration-(--duration-sheet) ease-(--ease-out-soft) group-hover:-translate-y-1 lg:right-1/2 lg:h-[36%] lg:translate-x-1/2 lg:group-hover:translate-x-1/2"
        />
        <span className="relative label-caps text-brand">{category.name}</span>
        <span className="relative mt-1.5 text-[2.75rem] font-display md:text-[3.5rem]">{goal}</span>
        {description && (
          <span className="relative mt-3 hidden max-w-[34ch] text-small text-night-muted md:line-clamp-3">
            {description}
          </span>
        )}
        <span className="relative mt-5 inline-flex h-11 items-center gap-2 self-start rounded-md bg-brand px-5 text-small font-bold text-ink transition-colors group-hover:bg-brand-hover">
          {big.buttonText || `Shop ${category.name.toLowerCase()}`}{" "}
          <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </Link>
    );
  }
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-shelf transition-[translate,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) md:hover:-translate-y-1.5 md:hover:shadow-[0_22px_40px_-18px_rgb(0_0_0/0.28),0_2px_6px_rgb(0_0_0/0.04)]"
    >
      {category.imageUrl && (
        <CloudImage
          src={category.imageUrl}
          alt=""
          ratio={null}
          blend
          trim
          sizes="(min-width: 1024px) 18vw, 45vw"
          className="h-28 w-full flex-none md:h-36"
          imgClassName="p-3 transition-transform duration-(--duration-sheet) ease-(--ease-out-soft) group-hover:scale-[1.06]"
        />
      )}
      <span className="mt-auto flex items-end justify-between gap-2 px-4 pt-2 pb-4 md:px-5 md:pb-5">
        <span>
          <span className="block label-caps text-brand-ink">{category.name}</span>
          <span className="mt-1 block text-[1.6rem] font-display md:text-[2rem]">{goal}</span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="mb-1.5 size-5 flex-none transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
