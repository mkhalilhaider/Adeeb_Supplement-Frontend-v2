import { useState } from "react";
import { Check, Tag, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Spinner } from "../../../components/ui/Spinner";
import { ApiError } from "../../../lib/api/errors";
import { cn } from "../../../lib/cn";
import { formatPrice } from "../../../lib/format";
import { useDebouncedValue } from "../../../lib/hooks";
import { useCartChoices } from "../cart-ui";
import { useCouponQuote, useDeliveryQuote, validateCoupon } from "../quotes";

/** Coupon entry: validates with the backend, shows the exact reason when a code doesn't apply. */
function CouponField({ subtotal, quote }) {
  const { couponCode, setCoupon, clearCoupon } = useCartChoices();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const apply = async (event) => {
    event.preventDefault();
    const code = draft.trim();
    if (!code) return;
    setPending(true);
    setError("");
    try {
      await validateCoupon({ code, subtotal: Math.round(subtotal) });
      setCoupon(code);
      setDraft("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't check that code. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };

  if (couponCode) {
    const invalid = quote.isError;
    return (
      <div className="flex items-start justify-between gap-3 rounded-sm border border-line bg-surface px-3 py-2.5">
        <div className="min-w-0 text-small">
          <p className="flex items-center gap-1.5 font-semibold">
            <Tag aria-hidden="true" className="size-4" /> {couponCode}
          </p>
          <p className={invalid ? "text-danger" : "text-success"}>
            {invalid
              ? quote.error?.message || "This code no longer applies"
              : quote.data
                ? `You save ${formatPrice(quote.data.discountAmount)}`
                : "Checking…"}
          </p>
        </div>
        <button
          type="button"
          onClick={clearCoupon}
          aria-label={`Remove coupon ${couponCode}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-shelf hover:text-ink"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} noValidate>
      <label htmlFor="coupon" className="text-small font-medium">
        Coupon code
      </label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id="coupon"
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
          className="!h-11 flex-1"
        />
        <Button type="submit" variant="outline" loading={pending} disabled={!draft.trim()}>
          Apply
        </Button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-1.5 text-small text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

/** Karachi vs other cities: the only thing the delivery fee depends on. */
function ZonePicker() {
  const { zone, setZone } = useCartChoices();
  const options = [
    { value: "karachi", label: "Karachi" },
    { value: "other", label: "Other city" },
  ];
  return (
    <fieldset>
      <legend className="text-small font-medium">Delivering to</legend>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex h-11 cursor-pointer items-center justify-center rounded-sm border text-small font-medium",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
              zone === o.value
                ? "border-ink bg-ink text-paper"
                : "border-line-strong bg-surface hover:border-ink",
            )}
          >
            <input
              type="radio"
              name="zone"
              value={o.value}
              checked={zone === o.value}
              onChange={() => setZone(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Row({ label, value, strong = false, tone }) {
  return (
    <div
      className={cn("flex items-baseline justify-between gap-4", strong && "text-body font-bold")}
    >
      <dt className={strong ? "" : "text-ink-2"}>{label}</dt>
      <dd className={cn("tabular-nums", tone)}>{value}</dd>
    </div>
  );
}

/**
 * Order summary for the cart page: subtotal, coupon, delivery estimate, total. Every amount
 * comes from the backend's rules; checkout confirms the final figures.
 */
export function CartSummary({ subtotal, blocked, onCheckout, checking }) {
  const { couponCode, zone } = useCartChoices();
  // Quotes follow the subtotal once it settles, so tapping + a few times sends one request.
  const quotedSubtotal = useDebouncedValue(subtotal, 400);
  const coupon = useCouponQuote(couponCode, quotedSubtotal);
  const delivery = useDeliveryQuote(zone, quotedSubtotal);
  const updating =
    quotedSubtotal !== subtotal || coupon.isPlaceholderData || delivery.isPlaceholderData;

  const discount = coupon.isSuccess && !coupon.isError ? coupon.data.discountAmount : 0;
  const fee = delivery.data?.shippingFee;
  const threshold = delivery.data?.freeDeliveryThreshold ?? 0;
  const total = subtotal - discount + (fee ?? 0);
  const toFree = threshold > 0 ? threshold - subtotal : 0;

  return (
    <section
      aria-labelledby="summary-heading"
      className="flex flex-col gap-5 bg-surface p-5 md:p-6"
    >
      <h2 id="summary-heading" className="text-h2 font-extrabold uppercase font-condensed">
        Order summary
      </h2>

      <ZonePicker />
      <CouponField subtotal={subtotal} quote={coupon} />

      {toFree > 0 && (
        <div className="text-small">
          <p>
            Add <strong className="tabular-nums">{formatPrice(toFree)}</strong> more for free
            delivery
          </p>
          <div aria-hidden="true" className="mt-2 h-1 bg-line">
            <div
              className="h-full bg-ink"
              style={{ width: `${Math.min(100, (subtotal / threshold) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <dl className="flex flex-col gap-2.5 border-t border-line pt-4 text-small">
        <Row label="Subtotal" value={formatPrice(subtotal)} />
        {discount > 0 && (
          <Row
            label={`Discount (${couponCode})`}
            value={`− ${formatPrice(discount)}`}
            tone="text-success"
          />
        )}
        <Row
          label="Delivery"
          value={
            delivery.isPending ? (
              <Spinner className="size-3.5" />
            ) : fee == null ? (
              "At checkout"
            ) : fee === 0 ? (
              <span className="inline-flex items-center gap-1 text-success">
                <Check aria-hidden="true" className="size-4" /> Free
              </span>
            ) : (
              formatPrice(fee)
            )
          }
        />
        <div
          aria-busy={updating}
          className={cn("border-t border-line pt-3 transition-opacity", updating && "opacity-50")}
        >
          <Row label="Estimated total" value={formatPrice(Math.max(0, total))} strong />
        </div>
      </dl>

      <Button size="lg" fullWidth onClick={onCheckout} disabled={blocked} loading={checking}>
        Checkout
      </Button>
      {blocked && (
        <p role="alert" className="-mt-2 text-small text-danger">
          Fix the highlighted items to continue.
        </p>
      )}
      <p className="-mt-1 text-center text-small text-ink-3">
        Pay cash on delivery. Final total confirmed at checkout.
      </p>
    </section>
  );
}
