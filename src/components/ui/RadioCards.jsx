import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "../../lib/cn";

/**
 * Selectable cards (saved addresses, delivery/payment choice). Arrow keys move between options,
 * as with native radios.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onValueChange
 * @param {string} props.label  Accessible name of the group
 * @param {{ value: string, title: string, description?: import("react").ReactNode, aside?: import("react").ReactNode, disabled?: boolean }[]} props.options
 */
export function RadioCards({ value, onValueChange, label, options, className, columns = 1 }) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onValueChange}
      aria-label={label}
      className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", className)}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={cn(
            "group flex w-full items-start gap-3 rounded-md border border-line-strong bg-surface p-4 text-left",
            "transition-colors duration-(--duration-fast) hover:border-ink-3",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            "data-[state=checked]:border-ink data-[state=checked]:shadow-[inset_0_0_0_1px_var(--color-ink)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong group-data-[state=checked]:border-ink">
            <RadioGroup.Indicator className="size-2.5 rounded-full bg-ink" />
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
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
