import { cn } from "../../lib/cn";

/** Small inline spinner; decorative — pair it with visible or sr-only text. */
export function Spinner({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}
