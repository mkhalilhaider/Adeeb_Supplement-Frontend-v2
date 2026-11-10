import { useParams } from "react-router";
import { Skeleton, SkeletonText } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { ApiError } from "../../lib/api/errors";
import { useProduct } from "../../features/catalog/queries";
import { ProductView } from "../../features/product/ProductView";
import NotFoundPage from "./NotFoundPage";

/** Loading layout with the same footprint as the page (no jump when data arrives). */
function ProductSkeleton() {
  return (
    <div role="status" className="page-container pt-4 pb-16 md:pt-6">
      <span className="sr-only">Loading product</span>
      <Skeleton className="h-4 w-48" />
      <div className="mt-4 grid gap-8 md:mt-6 md:grid-cols-[7fr_5fr] lg:gap-14">
        <Skeleton className="-mx-4 aspect-square md:mx-0" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-11/12" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-2 h-7 w-40" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-24" />
          </div>
          <Skeleton className="mt-4 h-12 w-full" />
          <SkeletonText lines={3} className="mt-4" />
        </div>
      </div>
    </div>
  );
}

/** /product/:slug */
export default function ProductPage() {
  const { slug } = useParams();
  const query = useProduct(slug);

  if (query.isPending) return <ProductSkeleton />;
  if (query.isError && !query.data) {
    if (query.error instanceof ApiError && query.error.isNotFound) return <NotFoundPage />;
    return (
      <div className="page-container">
        <ErrorState
          error={query.error}
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    );
  }
  // Keyed by id so state (gallery position, quantity) resets when moving to another product.
  return <ProductView key={query.data._id} product={query.data} />;
}
