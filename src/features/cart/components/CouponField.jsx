import { useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ApiError } from "../../../lib/api/errors";
import { formatPrice } from "../../../lib/format";
import { useCartChoices } from "../cart-ui";
import { validateCoupon } from "../quotes";
import { notify } from "../../../lib/notify";

/** Coupon entry: validates with the backend, shows the exact reason when a code doesn't apply. */
export function CouponField({ subtotal, quote }) {
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
      const result = await validateCoupon({ code, subtotal: Math.round(subtotal) });
      setCoupon(code);
      setDraft("");
      notify.success(
        result?.discountAmount
          ? `Coupon ${code.toUpperCase()} applied — ${formatPrice(result.discountAmount)} off`
          : `Coupon ${code.toUpperCase()} applied`,
      );
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
          onClick={() => {
            clearCoupon();
            notify.info(`Coupon ${couponCode} removed`);
          }}
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
