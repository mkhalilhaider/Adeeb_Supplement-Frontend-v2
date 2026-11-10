import { Check, XCircle } from "lucide-react";
import { cn } from "../../../lib/cn";
import { ORDER_STEPS, stepIndex } from "../lib/order-status";

/**
 * Where the order is: placed → confirmed → packing → on the way → delivered. Vertical on
 * phones, horizontal from md. Cancelled orders get a single clear message instead.
 *
 * @param {{ status: string, className?: string }} props
 */
export function OrderStatusTimeline({ status, className }) {
  if (status === "cancelled") {
    return (
      <p
        className={cn(
          "flex items-start gap-2 rounded-sm bg-danger-soft p-4 text-small text-danger",
          className,
        )}
      >
        <XCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        This order was cancelled. If you think that's a mistake, please contact us.
      </p>
    );
  }

  const current = Math.max(0, stepIndex(status));
  return (
    <ol
      aria-label="Order progress"
      className={cn("flex flex-col gap-0 md:flex-row md:gap-2", className)}
    >
      {ORDER_STEPS.map((step, i) => {
        const done = i < current || (i === current && status === "delivered");
        const active = i === current;
        return (
          <li
            key={step.status}
            aria-current={active ? "step" : undefined}
            className="relative flex gap-3 pb-5 last:pb-0 md:flex-1 md:flex-col md:gap-2 md:pb-0"
          >
            {/* connector */}
            {i < ORDER_STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-7 left-3.5 h-[calc(100%-1.75rem)] w-0.5 md:top-3.5 md:left-9 md:h-0.5 md:w-[calc(100%-2.75rem)]",
                  i < current ? "bg-ink" : "bg-line-strong",
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-semibold",
                done
                  ? "border-ink bg-ink text-paper"
                  : active
                    ? "border-brand bg-brand text-ink"
                    : "border-line-strong bg-surface text-ink-3",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className="flex flex-col">
              <span className={cn("font-semibold", !done && !active && "text-ink-3")}>
                {step.label}
                <span className="sr-only">
                  {done ? " (done)" : active ? " (current)" : " (not yet)"}
                </span>
              </span>
              {active && <span className="text-small text-ink-2">{step.detail}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
