import { useId } from "react";
import { cn } from "../../lib/cn";

/**
 * Selectable cards (saved addresses, delivery/payment choice). Native radio inputs underneath,
 * so arrow keys, form semantics and screen readers work without any library code.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onValueChange
 * @param {string} props.label  Accessible name of the group
 * @param {{ value: string, title: string, description?: import("react").ReactNode, aside?: import("react").ReactNode, disabled?: boolean }[]} props.options
 */
export function RadioCards({ value, onValueChange, label, options, className, columns = 1 }) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", className)}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex w-full cursor-pointer items-start gap-3 rounded-md border bg-surface p-4 text-left",
              "transition-colors duration-(--duration-fast)",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
              checked
                ? "border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]"
                : "border-line-strong hover:border-ink-3",
              option.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              disabled={option.disabled}
              onChange={() => onValueChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                checked ? "border-ink" : "border-line-strong",
              )}
            >
              {checked && <span className="size-2.5 rounded-full bg-ink" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-semibold text-ink">{option.title}</span>
              {option.description && (
                <span className="text-small text-ink-2">{option.description}</span>
              )}
            </span>
            {option.aside && (
              <span className="shrink-0 text-small font-semibold">{option.aside}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
