import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/cn";

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * − [ n ] + with direct typing. Buttons are 44px touch targets; the value is clamped to
 * [min, max] (max = stock) and committed on blur/Enter, never mid-typing.
 *
 * @param {object} props
 * @param {number} props.value
 * @param {(next: number) => void} props.onChange
 * @param {number} [props.min]
 * @param {number} [props.max]
 * @param {string} [props.label]  Accessible name, e.g. "Quantity for Gold Standard Whey"
 * @param {"sm"|"md"} [props.size]
 * @param {boolean} [props.disabled]
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Quantity",
  size = "md",
  disabled = false,
  className,
}) {
  // Only holds text while the user is typing; otherwise the prop value is shown as-is.
  const [draft, setDraft] = useState(null);

  const commit = (raw) => {
    const parsed = Number.parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? clamp(parsed, min, max) : value;
    setDraft(null);
    if (next !== value) onChange(next);
  };

  const box = size === "sm" ? "h-9" : "h-11";
  const btn = size === "sm" ? "w-9" : "w-11";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-stretch rounded-md border border-line-strong bg-surface",
        box,
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1, min, max))}
        className={cn(
          "flex items-center justify-center rounded-l-md text-ink transition-colors hover:bg-shelf disabled:text-ink-3 disabled:hover:bg-transparent",
          btn,
        )}
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={draft ?? String(value)}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit(e.currentTarget.value)}
        className="w-10 border-x border-line bg-transparent text-center font-semibold tabular-nums outline-none focus-visible:bg-shelf"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1, min, max))}
        className={cn(
          "flex items-center justify-center rounded-r-md text-ink transition-colors hover:bg-shelf disabled:text-ink-3 disabled:hover:bg-transparent",
          btn,
        )}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
