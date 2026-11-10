import { cn } from "../../lib/cn";

/**
 * Placeholder block shaped like the content it stands in for (same size → no layout shift).
 * Decorative: wrap groups in an element with role="status" + an sr-only "Loading" label.
 */
export function Skeleton({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block rounded-sm bg-[linear-gradient(90deg,var(--color-shelf)_25%,#e5e2db_50%,var(--color-shelf)_75%)] bg-[length:200%_100%]",
        "animate-[shimmer_1.6s_linear_infinite]",
        className,
      )}
    />
  );
}

/** Text lines of decreasing width. */
export function SkeletonText({ lines = 3, className }) {
  const widths = ["w-full", "w-11/12", "w-4/5", "w-2/3", "w-1/2"];
  return (
    <span className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3.5", widths[i % widths.length])} />
      ))}
    </span>
  );
}
