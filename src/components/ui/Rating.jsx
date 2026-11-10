import { useId } from "react";
import { cn } from "../../lib/cn";

/** One star, filled from the left by `fill` (0–1). Pure SVG, no icon font. */
function Star({ fill, size, id }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" className="shrink-0">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={20 * fill} height="20" />
        </clipPath>
      </defs>
      <path
        d="M10 1.6l2.47 5.18 5.68.73-4.16 3.93 1.05 5.63L10 14.32l-5.04 2.75 1.05-5.63L1.85 7.51l5.68-.73L10 1.6z"
        className="fill-line-strong"
      />
      <path
        d="M10 1.6l2.47 5.18 5.68.73-4.16 3.93 1.05 5.63L10 14.32l-5.04 2.75 1.05-5.63L1.85 7.51l5.68-.73L10 1.6z"
        className="fill-ink"
        clipPath={`url(#${id})`}
      />
    </svg>
  );
}

/**
 * Star rating for display. Reads as "Rated 4.4 out of 5, 5 reviews" to screen readers.
 * Renders nothing when there are no reviews (never show empty stars as if rated zero).
 *
 * @param {{ value: number, count?: number, size?: number, showValue?: boolean, single?: boolean }} props
 *   `single`: one person’s rating (a review) — no count, announced as "Rated 4 out of 5".
 */
export function Rating({ value, count, size = 14, showValue = false, single = false, className }) {
  const uid = useId();
  if (!value || (!count && !single)) return null;
  const rounded = Math.round(value * 10) / 10;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="sr-only">
        Rated {rounded} out of 5
        {!single && count != null ? `, ${count} review${count === 1 ? "" : "s"}` : ""}
      </span>
      <span aria-hidden="true" className="inline-flex items-center gap-px">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            id={`${uid}-${i}`}
            size={size}
            fill={Math.min(Math.max(rounded - i, 0), 1)}
          />
        ))}
      </span>
      <span aria-hidden="true" className="text-small text-ink-3 tabular-nums">
        {showValue && <span className="mr-1 font-semibold text-ink">{rounded.toFixed(1)}</span>}
        {!single && count != null && `(${count})`}
      </span>
    </span>
  );
}
