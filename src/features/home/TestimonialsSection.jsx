import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Star } from "lucide-react";
import { CloudImage } from "../../components/ui/CloudImage";
import { site } from "../../config/site";
import { formatPrice } from "../../lib/format";
import { fetchTestimonials } from "./api";
import { Slider } from "./Slider";

const DAY = 86_400_000;

/** "3 days ago", "2 weeks ago", "5 months ago" — the way Google shows review dates. */
function timeAgo(value) {
  if (!value) return "";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / DAY));
  const unit = (n, word) => `${n} ${word}${n === 1 ? "" : "s"} ago`;
  if (days < 1) return "Today";
  if (days < 7) return unit(days, "day");
  if (days < 31) return unit(Math.floor(days / 7), "week");
  if (days < 365) return unit(Math.floor(days / 30), "month");
  return unit(Math.floor(days / 365), "year");
}

function Stars({ value, className = "text-[15px]" }) {
  const n = Math.round(value);
  return (
    <span className={`tracking-[2px] text-brand ${className}`} aria-label={`${n} out of 5 stars`}>
      {"★".repeat(n)}
      <span className="text-line-strong">{"★".repeat(5 - n)}</span>
    </span>
  );
}

/**
 * One review. The whole card is a link: to the product it's about, or — for a review of the
 * store itself — to the Google listing. "Read more" sits above that link so it still works.
 */
function ReviewCard({ review }) {
  const [open, setOpen] = useState(false);
  const product = review.product;
  const long = review.text.length > 220;
  // Stretches the card's one link over the whole card.
  const cover = "after:absolute after:inset-0 after:z-[1] after:content-['']";
  return (
    <article className="group/card relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-[translate,box-shadow,border-color] duration-(--duration-base) ease-(--ease-out-soft) hover:border-ink/15 md:hover:-translate-y-1.5 md:hover:shadow-[0_22px_40px_-18px_rgb(0_0_0/0.28),0_2px_6px_rgb(0_0_0/0.04)]">
      {product ? (
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-line bg-[radial-gradient(70%_60%_at_50%_55%,#ffffff,var(--color-shelf))]">
          {product.image?.url && (
            <CloudImage
              src={product.image.url}
              alt=""
              ratio={null}
              trim
              blend
              sizes="220px"
              className="h-[78%] w-[60%]"
              imgClassName="transition-transform duration-(--duration-sheet) ease-(--ease-out-soft) group-hover/card:scale-[1.07]"
            />
          )}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-[4/3] items-center justify-center border-b border-line bg-shelf"
        >
          <span className="text-[120px] font-display leading-none text-line transition-[color,scale] duration-(--duration-sheet) ease-(--ease-out-soft) group-hover/card:scale-110 group-hover/card:text-brand/30">
            “
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Stars value={review.rating} />
        <div className="flex-1">
          <p
            className={`text-[15px] leading-[1.65] whitespace-pre-line text-ink-2 ${open ? "" : "line-clamp-5"}`}
          >
            {review.text}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="relative z-[2] mt-1 text-small font-bold text-brand-ink hover:underline"
            >
              {open ? "Show less" : "Read more"}
            </button>
          )}
        </div>
        {product ? (
          <Link
            to={`/product/${product.slug}`}
            className={`flex items-center gap-2.5 rounded-lg bg-shelf px-2.5 py-2 text-[13px] font-bold transition-colors duration-(--duration-base) group-hover/card:bg-ink group-hover/card:text-white ${cover}`}
          >
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[10px] font-extrabold tracking-[0.12em] text-ink-3 uppercase transition-colors group-hover/card:text-brand">
                Bought
              </span>
              <span className="truncate">{product.name}</span>
            </span>
            {product.price > 0 && (
              <span className="ml-auto font-extrabold whitespace-nowrap">
                {formatPrice(product.price)}
              </span>
            )}
            <ArrowRight
              aria-hidden="true"
              className="size-[15px] shrink-0 transition-transform group-hover/card:translate-x-0.5"
            />
          </Link>
        ) : (
          <a
            href={site.google.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 self-start text-[13px] font-bold text-brand-ink ${cover}`}
          >
            Read on Google
            <span className="sr-only"> (review by {review.name})</span>
            <ArrowRight
              aria-hidden="true"
              className="size-[15px] transition-transform group-hover/card:translate-x-0.5"
            />
          </a>
        )}
        <footer className="flex flex-col border-t border-line pt-3.5 leading-tight">
          <span className="text-[14px] font-bold">{review.name}</span>
          <span className="text-[12px] text-ink-3">
            {[timeAgo(review.reviewedAt), review.source === "google" ? "Google" : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </footer>
      </div>
    </article>
  );
}

/**
 * "What customers say": reviews the team copied from the Google listing (Admin → Reviews),
 * each with the product it was about. Writing a review opens Google, where reviews live —
 * a website can't post to Google for a customer. Hidden while there are no reviews.
 */
export default function TestimonialsSection() {
  const query = useQuery({
    queryKey: ["testimonials"],
    queryFn: ({ signal }) => fetchTestimonials({ signal }),
    staleTime: 10 * 60_000,
  });
  const items = query.data?.items ?? [];
  const summary = query.data?.summary;
  if (!items.length) return null;

  return (
    <section aria-labelledby="reviews-heading" className="page-container">
      <Slider
        label="Customer reviews"
        showDots
        header={
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div>
              <p className="label-caps text-brand-ink">Reviews from Google</p>
              <h2
                id="reviews-heading"
                className="mt-2 text-[2.5rem] font-display md:text-[3.25rem] lg:text-[4rem]"
              >
                What customers say
              </h2>
              {summary?.average && (
                <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] text-ink-2">
                  <Stars value={summary.average} />
                  <b className="text-ink">{summary.average.toFixed(1)}</b>
                  <span aria-hidden="true" className="text-line-strong">
                    ·
                  </span>
                  <span>Rated on Google</span>
                  <span aria-hidden="true" className="text-line-strong">
                    ·
                  </span>
                  <span>
                    {summary.count} review{summary.count === 1 ? "" : "s"}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:pb-1">
              <a
                href={site.google.reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 font-bold hover:text-brand-ink"
              >
                See all on Google
                <ArrowRight
                  aria-hidden="true"
                  className="size-4.5 transition-transform group-hover:translate-x-0.5"
                />
              </a>
              <a
                href={site.google.writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glide inline-flex h-12 items-center rounded-md bg-ink px-5 font-bold text-white hover:bg-[#262626] active:scale-[0.97]"
              >
                <span className="glide-label">
                  <span className="glide-icon" aria-hidden="true">
                    <Star className="fill-brand text-brand" />
                  </span>
                  Write a review on Google
                </span>
              </a>
            </div>
          </div>
        }
        items={items}
        getKey={(r) => r._id}
        itemClassName="w-[82%] sm:w-[46%] md:w-[calc((100%-24px)/3)] xl:w-[calc((100%-48px)/4)]"
        renderItem={(review) => <ReviewCard review={review} />}
      />
    </section>
  );
}
