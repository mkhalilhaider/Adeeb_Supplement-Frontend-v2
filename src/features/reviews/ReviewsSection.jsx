import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageSquareText } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Rating } from "../../components/ui/Rating";
import { SkeletonText } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { formatDate } from "../../lib/format";
import { useInViewOnce } from "../../lib/hooks";
import { fetchProductReviews } from "./api";

const PAGE = 5;

/** Counts per star (the backend sends only the average), computed from the reviews themselves. */
function breakdown(reviews) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) if (counts[r.rating] != null) counts[r.rating] += 1;
  return counts;
}

function reviewerName(review) {
  const first = review.user?.firstName?.trim();
  const last = review.user?.lastName?.trim();
  if (!first) return "Verified buyer";
  return last && last !== "-" ? `${first} ${last[0]}.` : first;
}

/**
 * Reviews block. Nothing is requested until the section is about to scroll into view.
 * Only verified buyers can review (backend rule), so every review here is from a real order.
 */
export function ReviewsSection({ productId, average, count }) {
  const [ref, seen] = useInViewOnce();
  const [shown, setShown] = useState(PAGE);
  const query = useQuery({
    queryKey: ["reviews", productId],
    queryFn: ({ signal }) => fetchProductReviews(productId, { signal }),
    enabled: seen && Boolean(productId),
    staleTime: 5 * 60_000,
  });

  const reviews = useMemo(() => query.data?.reviews ?? [], [query.data]);
  const counts = useMemo(() => breakdown(reviews), [reviews]);
  const total = reviews.length || count || 0;

  return (
    <section ref={ref} id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
      <h2 id="reviews-heading" className="text-h2 font-extrabold uppercase font-condensed">
        Reviews{total > 0 ? ` (${total})` : ""}
      </h2>

      {count === 0 && !query.data ? (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews yet"
          description="Reviews come only from customers who bought this product. Bought it? You can review it from your orders."
          action={
            <Button to="/account/orders" variant="outline">
              Go to my orders
            </Button>
          }
          className="py-8"
        />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} compact className="mt-4" />
      ) : !query.data ? (
        <div role="status" className="mt-6 grid gap-8 md:grid-cols-[16rem_1fr]">
          <span className="sr-only">Loading reviews</span>
          <SkeletonText lines={4} />
          <SkeletonText lines={6} />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 md:grid-cols-[16rem_1fr] md:gap-12">
          <div>
            <p className="text-6xl font-extrabold font-condensed tabular-nums">
              {(average || 0).toFixed(1)}
            </p>
            <Rating value={average} count={total} size={16} />
            <dl className="mt-4 flex flex-col gap-1.5">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 text-small">
                  <dt className="w-10 shrink-0 text-ink-2 tabular-nums">{star} star</dt>
                  <dd className="flex flex-1 items-center gap-2">
                    <span aria-hidden="true" className="h-1.5 flex-1 bg-line">
                      <span
                        className="block h-full bg-ink"
                        style={{
                          width: `${reviews.length ? (counts[star] / reviews.length) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <span className="w-6 text-right text-ink-3 tabular-nums">{counts[star]}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-small text-ink-3">
              Only verified buyers can review. Bought this?{" "}
              <a href="/account/orders" className="underline underline-offset-2 hover:text-ink">
                Review it from your orders
              </a>
              .
            </p>
          </div>

          <div>
            <ul className="flex flex-col">
              {reviews.slice(0, shown).map((review) => (
                <li key={review._id} className="border-b border-line py-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Rating value={review.rating} size={14} single />
                    {review.title && <p className="font-semibold">{review.title}</p>}
                  </div>
                  {review.comment && <p className="mt-2 text-ink-2">{review.comment}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 text-small text-ink-3">
                    <span>{reviewerName(review)}</span>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <BadgeCheck aria-hidden="true" className="size-4" /> Verified purchase
                      </span>
                    )}
                    <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                  </p>
                </li>
              ))}
            </ul>
            {reviews.length > shown && (
              <Button variant="outline" className="mt-5" onClick={() => setShown((n) => n + PAGE)}>
                Show more reviews ({reviews.length - shown})
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
