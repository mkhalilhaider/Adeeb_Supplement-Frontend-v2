import { cn } from "../../lib/cn";

/**
 * Small status label. Tones map to meaning, never decoration:
 * sale (deal), success (in stock / delivered), warning (low stock / pending),
 * danger (sold out / cancelled), neutral (info), ink (emphasis, e.g. "New").
 */
const tones = {
  sale: "bg-brand text-ink",
  success: "bg-success-soft text-success",
  warning: "bg-brand-soft text-[#9a3b0f]",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-shelf text-ink-2",
  ink: "bg-ink text-paper",
};

export function Badge({ tone = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm px-2 text-[12px] leading-none font-bold tracking-[0.02em] tabular-nums",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Order status → wording + tone, used in account and admin. */
const ORDER_STATUS = {
  pending: { label: "Awaiting confirmation", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "neutral" },
  processing: { label: "Packing", tone: "neutral" },
  shipped: { label: "On the way", tone: "ink" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export function OrderStatusBadge({ status, className }) {
  const entry = ORDER_STATUS[status] ?? { label: status, tone: "neutral" };
  return (
    <Badge tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  );
}
