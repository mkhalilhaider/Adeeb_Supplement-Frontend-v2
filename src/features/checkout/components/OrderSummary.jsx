import { Link } from "react-router";
import { AlertTriangle, Check } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { CloudImage } from "../../../components/ui/CloudImage";
import { Spinner } from "../../../components/ui/Spinner";
import { cn } from "../../../lib/cn";
import { formatPrice } from "../../../lib/format";
import { CouponField } from "../../cart/components/CouponField";
import { variantLabel } from "../../product/lib/variant-matrix";

function Row({ label, value, strong = false, tone }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", strong && "text-h3 font-bold")}>
      <dt className={strong ? "" : "text-ink-2"}>{label}</dt>
      <dd className={cn("tabular-nums", tone)}>{value}</dd>
    </div>
  );
}

/**
 * Right-hand column of checkout: what's being ordered, coupon, delivery fee for the entered
 * city and the amount to pay on delivery. The Place order button submits the form beside it
 * (form attribute), so the coupon field can be its own form.
 *
 * @param {object} props
 * @param {import("../../cart/guest-cart").CartLine[]} props.lines
 * @param {Map<string, import("../../cart/lib/line-check").LineCheck>} props.checks
 * @param {number} props.subtotal
 * @param {string} props.couponCode
 * @param {import("@tanstack/react-query").UseQueryResult<any>} props.coupon
 * @param {import("@tanstack/react-query").UseQueryResult<any>} props.delivery
 * @param {boolean} props.hasCity
 * @param {boolean} props.submitting
 * @param {boolean} props.blocked
 * @param {import("react").ReactNode} [props.error]
 * @param {string} props.formId
 */
export function OrderSummary({
  lines,
  checks,
  subtotal,
  couponCode,
  coupon,
  delivery,
  hasCity,
  submitting,
  blocked,
  error,
  formId,
}) {
  const discount = couponCode && coupon.isSuccess ? coupon.data.discountAmount : 0;
  const fee = hasCity ? delivery.data?.shippingFee : undefined;
  const total = Math.max(0, subtotal - discount + (fee ?? 0));
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  let deliveryValue;
  if (!hasCity) deliveryValue = <span className="text-ink-3">Enter your city</span>;
  else if (delivery.isPending || (delivery.isFetching && delivery.isPlaceholderData))
    deliveryValue = (
      <>
        <Spinner className="size-3.5" />
        <span className="sr-only">Checking delivery fee</span>
      </>
    );
  else if (fee == null) deliveryValue = <span className="text-ink-3">Confirmed by phone</span>;
  else if (fee === 0)
    deliveryValue = (
      <span className="inline-flex items-center gap-1 text-success">
        <Check aria-hidden="true" className="size-4" /> Free
      </span>
    );
  else deliveryValue = formatPrice(fee);

  return (
    <section
      aria-labelledby="summary-heading"
      className="flex flex-col gap-5 bg-surface p-5 md:p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="summary-heading" className="text-h2 font-extrabold uppercase font-condensed">
          Your order
        </h2>
        <Link to="/cart" className="text-small font-medium text-ink-2 underline hover:text-ink">
          Edit cart
        </Link>
      </div>

      <ul aria-label={`${count} ${count === 1 ? "item" : "items"}`} className="flex flex-col">
        {lines.map((line) => {
          const check = checks.get(line.variantId);
          const price = check?.livePrice ?? line.unitPrice;
          const problem = check && (check.status === "unavailable" || check.status === "low");
          const image = line.image?.url ?? check?.image?.url;
          return (
            <li key={line.variantId} className="flex gap-3 border-b border-line py-3 first:pt-0">
              <div className="relative size-16 shrink-0 bg-shelf p-1">
                <CloudImage
                  src={image}
                  alt=""
                  ratio={null}
                  sizes="64px"
                  trim
                  blend
                  className="size-full"
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-paper"
                >
                  {line.quantity}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-small">
                <p className="line-clamp-2 font-medium">{line.name}</p>
                {variantLabel(line) && <p className="text-ink-3">{variantLabel(line)}</p>}
                <p className="text-ink-3">
                  <span className="sr-only">Quantity </span>
                  {line.quantity} × {formatPrice(price)}
                </p>
                {problem && (
                  <p className="flex items-start gap-1 text-danger">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    {check.message}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-small font-semibold tabular-nums">
                {formatPrice(price * line.quantity)}
              </p>
            </li>
          );
        })}
      </ul>

      <CouponField subtotal={subtotal} quote={coupon} />

      <dl className="flex flex-col gap-2.5 border-t border-line pt-4 text-small">
        <Row label="Subtotal" value={formatPrice(subtotal)} />
        {discount > 0 && (
          <Row
            label={`Discount (${couponCode})`}
            value={`− ${formatPrice(discount)}`}
            tone="text-success"
          />
        )}
        <Row label="Delivery" value={deliveryValue} />
        <div className="border-t border-line pt-3">
          <Row label="Total" value={formatPrice(total)} strong />
        </div>
      </dl>

      {error}

      <Button
        type="submit"
        form={formId}
        size="lg"
        fullWidth
        loading={submitting}
        disabled={blocked}
      >
        Place order{hasCity && fee != null ? ` · ${formatPrice(total)}` : ""}
      </Button>
      {blocked ? (
        <p role="alert" className="-mt-2 text-small text-danger">
          Some items can't be ordered as they are.{" "}
          <Link to="/cart" className="font-medium underline">
            Review your cart
          </Link>
        </p>
      ) : (
        <p className="-mt-2 text-center text-small text-ink-3">
          Cash on delivery — pay when your order arrives.
        </p>
      )}
    </section>
  );
}
