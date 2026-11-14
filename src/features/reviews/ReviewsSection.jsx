import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MessageSquareText } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Rating } from "../../components/ui/Rating";
import { SkeletonText } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { site } from "../../config/site";
import { ReviewPhotoStrip } from "./ReviewPhotos";
import { fetchProductStoreReviews, productStoreReviewsKey, timeAgo } from "./store-reviews";

const PAGE = 5;

/** Google's "G", for "Reviews from our Google listing". */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0">
      <path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5z"
      />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3z" />
      <path
        fill="#EA4335"
        d="M12 4.6c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3c.9-2.7 3.4-4.7 6.4-5.2z"
      />
    </svg>
  );
}

function WriteOnGoogle({ className }) {
  return (
    <a
      href={site.google.writeReviewUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ?? "inline-flex items-center gap-1 text-small font-bold hover:text-brand-ink"
      }
    >
      Write a review on Google <ArrowUpRight aria-hidden="true" className="size-4" />
    </a>
  );
}

/**
 * Product page reviews: the store's reviews from Admin → Reviews (copied from Google), in the
 * product page's own style. Reviews about this product come first, then the ones switched on
 * for every product page. The request is shared with the rating line under the product name.
 */
export function ReviewsSection({ productId }) {
  const [shown, setShown] = useState(PAGE);
  const query = useQuery({
    queryKey: productStoreReviewsKey(productId),
    queryFn: ({ signal }) => fetchProductStoreReviews(productId, { signal }),
    enabled: Boolean(productId),
    staleTime: 10 * 60_000,
  });

  const reviews = query.data?.items ?? [];
  const summary = query.data?.summary;
  const max = Math.max(1, ...(summary?.stars ?? []).map((s) => s.count));

  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-[2rem] font-display md:text-[2.5rem]">
        Reviews
      </h2>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} compact className="mt-4" />
      ) : !query.data ? (
        <div role="status" className="mt-6 grid gap-8 md:grid-cols-[16rem_1fr]">
          <span className="sr-only">Loading reviews</span>
          <SkeletonText lines={4} />
          <SkeletonText lines={6} />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews yet"
          description="Bought from us? We'd love to hear how it went."
          action={<WriteOnGoogle className="inline-flex items-center gap-1 font-bold underline" />}
          className="py-8"
        />
      ) : (
        <div className="mt-6 grid gap-8 md:grid-cols-[16rem_1fr] md:gap-12">
          <div>
            <p className="text-6xl font-display tabular-nums">
              {(summary?.average ?? 0).toFixed(1)}
            </p>
            <Rating value={summary?.average ?? 0} count={summary?.count} size={16} />
            <p className="mt-3 flex items-center gap-2 text-small text-ink-2">
              <GoogleMark /> Reviews from our Google listing
            </p>
            <dl className="mt-4 flex flex-col gap-1.5">
              {(summary?.stars ?? []).map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-2 text-small">
                  <dt className="w-10 shrink-0 text-ink-2 tabular-nums">{stars} star</dt>
                  <dd className="flex flex-1 items-center gap-2">
                    <span aria-hidden="true" className="h-1.5 flex-1 bg-line">
                      <span
                        className="block h-full bg-ink"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </span>
                    <span className="sr-only">{count}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4">
              <WriteOnGoogle />
            </p>
          </div>

          <div>
            <ul className="flex flex-col">
              {reviews.slice(0, shown).map((review) => (
                <li key={review._id} className="border-b border-line py-5 first:pt-0">
                  <Rating value={review.rating} size={14} single />
                  <p className="mt-2 whitespace-pre-line text-ink-2">{review.text}</p>
                  <ReviewPhotoStrip photos={review.photos} name={review.name} className="mt-3" />
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-3">
                    <span className="font-semibold text-ink">{review.name}</span>
                    {review.source === "google" && (
                      <span className="inline-flex items-center gap-1.5 text-ink-2">
                        <GoogleMark /> Google
                      </span>
                    )}
                    {review.reviewedAt && (
                      <time dateTime={review.reviewedAt}>{timeAgo(review.reviewedAt)}</time>
                    )}
                    {review.product &&
                      (review.forThisProduct ? (
                        <span className="font-bold text-brand-ink">Bought this product</span>
                      ) : (
                        <Link
                          to={`/product/${review.product.slug}`}
                          className="font-bold text-brand-ink hover:underline"
                        >
                          Bought: {review.product.name} →
                        </Link>
                      ))}
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

export default ReviewsSection;
