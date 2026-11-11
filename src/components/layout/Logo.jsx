import { Link } from "react-router";
import { cn } from "../../lib/cn";

/** Wordmark: condensed "ADEEB" + mono "SUPPLEMENT", with the bolt from the brand mark. */
export function Logo({ className, inverted = false }) {
  return (
    <Link to="/" className={cn("inline-flex shrink-0 items-center gap-1.5", className)}>
      <svg viewBox="0 0 12 20" aria-hidden="true" className="h-5 w-3 fill-brand">
        <path d="M7.5 0 0 11.5h4.6L3.4 20 12 7.6H7.2L7.5 0Z" />
      </svg>
      <span
        className={cn(
          "text-[23px] leading-none font-extrabold tracking-wide font-condensed",
          inverted ? "text-paper" : "text-ink",
        )}
      >
        ADEEB
      </span>{" "}
      <span
        className={cn(
          "mt-0.5 label-mono text-[10px] tracking-[0.22em]",
          inverted ? "text-night-muted" : "text-brand-ink",
        )}
      >
        Supplement
      </span>
      {/* Name = the visible words plus where the link goes (WCAG 2.5.3, label in name). */}
      <span className="sr-only">, home</span>
    </Link>
  );
}
