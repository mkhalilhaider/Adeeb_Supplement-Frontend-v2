import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, MapPin, Truck } from "lucide-react";
import { Field } from "../../components/ui/Field";
import { Input, Textarea } from "../../components/ui/Input";
import { RadioCards } from "../../components/ui/RadioCards";
import { ApiError } from "../../lib/api/errors";
import { formatPkPhone, formatPrice } from "../../lib/format";
import { useDebouncedValue } from "../../lib/hooks";
import { useForm } from "../../lib/use-form";
import { useCartChoices } from "../cart/cart-ui";
import { useGuestCart } from "../cart/guest-cart";
import { blocksCheckout } from "../cart/lib/line-check";
import { useCityDeliveryQuote, useCouponQuote, useLineChecks } from "../cart/quotes";
import { cartKeys } from "../cart/useCart";
import { catalogKeys } from "../catalog/queries";
import { fetchAddresses, placeOrder } from "./api";
import { OrderSummary } from "./components/OrderSummary";
import { buildCheckoutBody } from "./lib/checkout-body";
import { validateCheckout } from "./lib/validate-checkout";
import { checkoutKey, finishCheckout, readDraft, writeDraft } from "./lib/checkout-session";
import { canonicalCity, PK_CITIES } from "./lib/pk-cities";
import { useCheckoutProgress } from "./useCheckoutProgress";

const FORM_ID = "checkout-form";
const NEW_ADDRESS = "new";

function Section({ step, title, icon: Icon, children, aside }) {
  const id = `checkout-${step}`;
  return (
    <section aria-labelledby={id} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id={id} className="flex items-center gap-2.5 text-h3 font-bold">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-ink label-mono text-[12px] text-paper"
          >
            {step}
          </span>
          {Icon && <Icon aria-hidden="true" className="size-5 text-ink-3" />}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * One-page cash-on-delivery checkout. The form keeps a draft in this tab, saves progress for
 * follow-ups, shows the delivery fee for the city as it is typed, and places the order once
 * (double submits are ignored). The backend recomputes every amount.
 *
 * @param {{ cart: ReturnType<typeof import("../cart/useCart").useCart>, user: import("../../types").SessionUser|null, loggedIn: boolean }} props
 */
export function CheckoutView({ cart, user, loggedIn }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sessionKey] = useState(checkoutKey);
  const [submitError, setSubmitError] = useState(/** @type {ApiError|null} */ (null));
  const [placing, setPlacing] = useState(false);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const errorRef = useRef(/** @type {HTMLDivElement|null} */ (null));

  const { couponCode, clearCoupon } = useCartChoices();

  const fullName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "";
  const form = useForm(() => ({
    email: "",
    phone: "",
    fullName,
    addressLine1: "",
    addressLine2: "",
    city: "",
    notes: "",
    addressId: "",
    ...readDraft(),
  }));
  const { values, errors, field, set, getValue } = form;

  // Saved addresses (logged in): preselect the default one the first time they load.
  const addresses = useQuery({
    queryKey: ["account", "addresses"],
    queryFn: ({ signal }) => fetchAddresses({ signal }),
    enabled: loggedIn,
    staleTime: 5 * 60_000,
    meta: { private: true },
  });
  const saved = useMemo(() => (loggedIn ? (addresses.data ?? []) : []), [loggedIn, addresses.data]);
  useEffect(() => {
    if (!saved.length || getValue("addressId")) return;
    const preferred = saved.find((a) => a.isDefault) ?? saved[0];
    set("addressId", preferred._id);
  }, [saved, getValue, set]);

  const chosen = saved.find((a) => a._id === values.addressId);
  const usingSaved = Boolean(chosen);

  // Draft (this tab only) so a reload or a trip back to the cart keeps what was typed.
  const draft = useDebouncedValue(JSON.stringify(values), 400);
  useEffect(() => {
    writeDraft(JSON.parse(draft));
  }, [draft]);

  // Live price/stock re-check and amounts.
  const { checks } = useLineChecks(cart.lines, { enabled: cart.lines.length > 0 });
  const subtotal = cart.lines.reduce((sum, l) => {
    const check = checks.get(l.variantId);
    return check?.status === "unavailable"
      ? sum
      : sum + (check?.livePrice ?? l.unitPrice) * l.quantity;
  }, 0);
  const blocked = cart.lines.some((l) =>
    blocksCheckout(checks.get(l.variantId) ?? { status: "ok" }),
  );

  const city = usingSaved ? chosen.city : (values.city ?? "");
  const quoteCity = useDebouncedValue(city, 500);
  const quoteSubtotal = useDebouncedValue(subtotal, 400);
  const delivery = useCityDeliveryQuote(quoteCity, quoteSubtotal);
  const coupon = useCouponQuote(couponCode, quoteSubtotal);
  const hasCity = city.trim().length >= 2;
  const itemCount = cart.lines.reduce((n, l) => n + l.quantity, 0);
  const estimate =
    subtotal -
    (couponCode && coupon.isSuccess ? coupon.data.discountAmount : 0) +
    (hasCity ? (delivery.data?.shippingFee ?? 0) : 0);

  useCheckoutProgress({
    values: { ...values, city, fullName: usingSaved ? chosen.fullName : values.fullName },
    lines: cart.lines,
    loggedIn,
    sessionKey,
    enabled: !placing,
  });

  const onSubmit = async (formValues) => {
    if (inFlight.current || blocked) return;
    inFlight.current = true;
    setPending(true);
    setSubmitError(null);
    try {
      const order = await placeOrder(
        buildCheckoutBody({
          values: { ...formValues, addressId: usingSaved ? formValues.addressId : "" },
          lines: cart.lines,
          loggedIn,
          // An expired or invalid code would fail the whole order: send only a working one.
          couponCode: couponCode && coupon.isSuccess ? couponCode : undefined,
          sessionKey,
        }),
      );
      setPlacing(true);
      finishCheckout(order);
      if (cart.source === "guest") useGuestCart.getState().clear();
      else {
        queryClient.setQueryData(cartKeys.server, (c) => (c ? { ...c, items: [] } : c));
        queryClient.invalidateQueries({ queryKey: cartKeys.server });
      }
      clearCoupon();
      navigate(`/order/${encodeURIComponent(order.orderNumber)}/confirmed`, {
        replace: true,
        state: { order },
      });
    } catch (error) {
      inFlight.current = false;
      setPending(false);
      const apiError =
        error instanceof ApiError ? error : new ApiError("Something went wrong. Please try again.");
      setSubmitError(apiError);
      // Stock or price moved under us: refresh the line checks so the summary shows what changed.
      if (apiError.isConflict) queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    }
  };

  // Move focus to the error so keyboard and screen-reader users hear what went wrong.
  useEffect(() => {
    if (submitError) errorRef.current?.focus();
  }, [submitError]);

  const submitting = placing || pending;
  const errorBox = submitError && (
    <div
      ref={errorRef}
      tabIndex={-1}
      role="alert"
      className="rounded-sm border border-danger/40 bg-danger-soft p-4 text-small text-danger outline-none"
    >
      <p className="font-semibold">We couldn't place your order</p>
      <p className="mt-1 text-ink">
        {submitError.isNetwork || submitError.isTimeout
          ? "The connection dropped while placing your order, so it may have gone through. Check your email or call us before trying again."
          : submitError.message}
      </p>
    </div>
  );

  const nameField = (
    <Field label="Full name" required error={errors.fullName}>
      {(f) => <Input {...f} autoComplete="name" {...field("fullName")} />}
    </Field>
  );
  const phoneField = (
    <Field
      label="Mobile number"
      required
      hint="The rider calls this number before delivery"
      error={errors.phone}
    >
      {(f) => (
        <Input
          {...f}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0300 1234567"
          {...field("phone")}
        />
      )}
    </Field>
  );

  return (
    <div className="page-container pt-6 pb-16 md:pt-10">
      <h1 className="text-h1 font-extrabold uppercase font-condensed md:text-5xl">Checkout</h1>
      {/* Phones: the summary sits below the form, so show the amount up front. */}
      <a
        href="#summary-heading"
        className="mt-4 flex items-center justify-between gap-4 rounded-sm bg-surface px-4 py-3 text-small lg:hidden"
      >
        <span className="text-ink-2">
          {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
          <span className="underline">View order</span>
        </span>
        <span className="font-bold tabular-nums">{formatPrice(Math.max(0, estimate))}</span>
      </a>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_26rem] lg:gap-12">
        <form
          id={FORM_ID}
          onSubmit={(event) =>
            form.handleSubmit(
              (v) => validateCheckout(v, { loggedIn, savedIds: saved.map((a) => a._id) }),
              onSubmit,
            )(event)
          }
          noValidate
          aria-label="Delivery and payment details"
          className="flex flex-col gap-8"
        >
          <Section step={1} title="Contact">
            {loggedIn ? (
              <p className="text-small text-ink-2">
                Ordering as <span className="font-semibold text-ink">{fullName || "you"}</span>
                {user?.email && <> · {user.email}</>}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {phoneField}
                <Field
                  label="Email"
                  hint="Optional — for your order confirmation"
                  error={errors.email}
                >
                  {(f) => (
                    <Input
                      {...f}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      {...field("email")}
                    />
                  )}
                </Field>
              </div>
            )}
          </Section>

          <Section step={2} title="Delivery address" icon={MapPin}>
            {saved.length > 0 && (
              <RadioCards
                label="Delivery address"
                value={values.addressId || NEW_ADDRESS}
                onValueChange={(v) => set("addressId", v)}
                columns={2}
                className="mb-4"
                options={[
                  ...saved.map((a) => ({
                    value: a._id,
                    title: a.fullName,
                    description: `${a.addressLine1}${a.addressLine2 ? `, ${a.addressLine2}` : ""}, ${a.city} · ${formatPkPhone(a.phone)}`,
                  })),
                  { value: NEW_ADDRESS, title: "Use a new address" },
                ]}
              />
            )}

            {!usingSaved && (
              <div className="grid gap-4 sm:grid-cols-2">
                {nameField}
                {loggedIn && phoneField}
                <Field
                  className="sm:col-span-2"
                  label="Address"
                  required
                  hint="House or flat number, street and area"
                  error={errors.addressLine1}
                >
                  {(f) => <Input {...f} autoComplete="address-line1" {...field("addressLine1")} />}
                </Field>
                <Field label="Nearby landmark" hint="Optional — helps the rider find you">
                  {(f) => <Input {...f} autoComplete="address-line2" {...field("addressLine2")} />}
                </Field>
                <Field label="City" required error={errors.city}>
                  {(f) => (
                    <>
                      <Input
                        {...f}
                        list="pk-cities"
                        autoComplete="address-level2"
                        {...field("city", {
                          onBlur: (e) => set("city", canonicalCity(e.target.value)),
                        })}
                      />
                      <datalist id="pk-cities">
                        {PK_CITIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </>
                  )}
                </Field>
              </div>
            )}
          </Section>

          <Section step={3} title="Delivery" icon={Truck}>
            <p className="rounded-sm border border-line bg-surface p-4 text-small text-ink-2">
              {!hasCity
                ? "Enter your city to see the delivery fee."
                : delivery.data?.zone === "karachi"
                  ? "Karachi: delivered by our own rider."
                  : delivery.data
                    ? `${canonicalCity(city)}: delivered by courier, anywhere in Pakistan.`
                    : "Checking delivery for your city…"}
            </p>
          </Section>

          <Section step={4} title="Payment" icon={Banknote}>
            <div className="flex items-start gap-3 rounded-md border border-ink bg-surface p-4 shadow-[inset_0_0_0_1px_var(--color-ink)]">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-ink"
              >
                <span className="size-2.5 rounded-full bg-ink" />
              </span>
              <div>
                <p className="font-semibold">Cash on delivery</p>
                <p className="text-small text-ink-2">
                  Pay in cash when your order arrives. No card needed.
                </p>
              </div>
            </div>
          </Section>

          <Section step={5} title="Order notes">
            <Field label="Anything we should know?" hideLabel>
              {(f) => (
                <Textarea
                  {...f}
                  rows={3}
                  maxLength={500}
                  placeholder="Optional — e.g. best time to call, gate number"
                  {...field("notes")}
                />
              )}
            </Field>
          </Section>
        </form>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <OrderSummary
            lines={cart.lines}
            checks={checks}
            subtotal={subtotal}
            couponCode={couponCode}
            coupon={coupon}
            delivery={delivery}
            hasCity={hasCity}
            submitting={submitting}
            blocked={blocked}
            error={errorBox}
            formId={FORM_ID}
          />
        </div>
      </div>
    </div>
  );
}
