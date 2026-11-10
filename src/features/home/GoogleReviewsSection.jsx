import { useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ExternalLink, Star } from "lucide-react";
import { Rating } from "../../components/ui/Rating";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Skeleton } from "../../components/ui/Skeleton";
import { site } from "../../config/site";
import { fetchGoogleReviews } from "./api";
import { Slider } from "./Slider";

function ReviewCard({ review }) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-sm border border-line bg-surface p-5">
      <header className="flex items-center gap-3">
        {review.avatar ? (
          <img
            src={review.avatar}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="size-10 shrink-0 rounded-full bg-shelf object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-shelf font-semibold"
          >
            {review.author.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{review.author}</p>
          <p className="text-small text-ink-3">{review.date}</p>
        </div>
      </header>
      <Rating value={review.rating} single size={16} />
      {review.text && <p className="line-clamp-6 text-small text-ink-2">{review.text}</p>}
      {review.link && (
        <a
          href={review.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1 self-start text-small font-medium underline"
        >
          Read on Google<span className="sr-only"> (review by {review.author})</span>
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      )}
    </article>
  );
}

/**
 * Live Google reviews, page by page: the first page loads when the section nears the screen,
 * the next one when the shopper reaches the last slides. If the reviews service isn't set up
 * or Google fails, only a link to the Google listing remains — no stored or invented reviews.
 */
export default function GoogleReviewsSection() {
  const query = useInfiniteQuery({
    queryKey: ["google-reviews"],
    queryFn: ({ pageParam, signal }) => fetchGoogleReviews(pageParam, { signal }),
    initialPageParam: /** @type {string|null} */ (null),
    getNextPageParam: (last) => last.next ?? undefined,
    staleTime: 60 * 60_000,
    retry: false,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const first = query.data?.pages[0];
  const reviews = (query.data?.pages ?? []).flatMap((p) => p.reviews);
  const placeUrl = first?.placeUrl ?? site.store.mapsUrl;

  if (query.isPending) {
    return (
      <section aria-busy="true" aria-label="Google reviews loading" className="page-container">
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (query.isError || reviews.length === 0) {
    return (
      <section className="page-container">
        <a
          href={placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 rounded-sm border border-line bg-surface p-5 hover:border-ink-3"
        >
          <span className="flex items-center gap-3">
            <Star aria-hidden="true" className="size-6 fill-brand text-brand" />
            <span className="font-semibold">
              {first?.rating
                ? `Rated ${first.rating} on Google`
                : "See what customers say on Google"}
            </span>
          </span>
          <ExternalLink aria-hidden="true" className="size-4 text-ink-3" />
        </a>
      </section>
    );
  }

  return (
    <section aria-labelledby="google-reviews-heading" className="page-container">
      <Slider
        label="Google reviews"
        header={
          <div>
            <SectionHeading
              id="google-reviews-heading"
              eyebrow="Google reviews"
              title="What customers say"
            />
            {first?.rating && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-small text-ink-2">
                <Rating value={first.rating} single size={16} />
                <span className="font-semibold text-ink">{first.rating.toFixed(1)}</span>
                {first.total ? <span>from {first.total} reviews</span> : null}
                <span aria-hidden="true">·</span>
                <a
                  href={placeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  See all on Google
                </a>
              </p>
            )}
          </div>
        }
        items={reviews}
        getKey={(r) => r.id}
        itemClassName="w-[87%] sm:w-[48%] lg:w-[calc((100%-24px)/3)]"
        renderItem={(review) => <ReviewCard review={review} />}
        onNearEnd={loadMore}
      />
    </section>
  );
}
