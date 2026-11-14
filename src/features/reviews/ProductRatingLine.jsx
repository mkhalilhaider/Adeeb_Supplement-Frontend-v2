import { useQuery } from "@tanstack/react-query";
import { Rating } from "../../components/ui/Rating";
import { fetchProductStoreReviews, productStoreReviewsKey } from "./store-reviews";

/**
 * "★★★★★ 4.8 · Rated on Google" under the product name, linking to the reviews below. Same
 * request as the reviews section (shared cache entry). Loaded on its own, just after the page,
 * so it adds nothing to the product page's first download; shows nothing until the reviews arrive.
 */
export default function ProductRatingLine({ productId }) {
  const query = useQuery({
    queryKey: productStoreReviewsKey(productId),
    queryFn: ({ signal }) => fetchProductStoreReviews(productId, { signal }),
    enabled: Boolean(productId),
    staleTime: 10 * 60_000,
  });
  const rating = query.data?.summary?.average ?? 0;
  if (!rating) return null;
  return (
    <a href="#reviews" className="mt-2 inline-flex items-center gap-2 hover:underline">
      <Rating value={rating} size={15} showValue />
      <span className="text-small text-ink-3">· Rated on Google</span>
      <span className="sr-only">Read reviews</span>
    </a>
  );
}
