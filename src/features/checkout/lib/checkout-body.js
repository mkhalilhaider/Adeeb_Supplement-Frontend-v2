import { normalizePkPhone } from "../../../lib/format";
import { canonicalCity } from "./pk-cities";

/**
 * @typedef {object} CheckoutValues  What the checkout form holds
 * @property {string} email          Guests only (optional)
 * @property {string} phone
 * @property {string} fullName
 * @property {string} addressLine1
 * @property {string} addressLine2
 * @property {string} city
 * @property {string} notes
 * @property {string} addressId      Saved address chosen by a logged-in shopper ("" = new)
 */

const clean = (value, max = 300) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

/**
 * The POST /orders/checkout body. Items are always sent (works for guests and accounts, and is
 * exactly what the shopper sees). Logged-in orders never carry guestEmail — the backend would
 * file them as guest orders, missing from the account.
 *
 * @param {object} input
 * @param {CheckoutValues} input.values
 * @param {import("../../cart/guest-cart").CartLine[]} input.lines
 * @param {boolean} input.loggedIn
 * @param {string} [input.couponCode]
 * @param {string} input.sessionKey
 */
export function buildCheckoutBody({ values, lines, loggedIn, couponCode, sessionKey }) {
  const body = {
    items: lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      productName: l.name,
    })),
    paymentMethod: "cod",
    checkoutSessionKey: sessionKey,
  };

  if (loggedIn && values.addressId) {
    body.addressId = values.addressId;
  } else {
    body.shippingAddress = {
      fullName: clean(values.fullName, 120),
      phone: normalizePkPhone(values.phone) ?? clean(values.phone, 20),
      addressLine1: clean(values.addressLine1),
      addressLine2: clean(values.addressLine2),
      city: canonicalCity(values.city),
      country: "Pakistan",
    };
  }

  const email = clean(values.email, 200).toLowerCase();
  if (!loggedIn && email) body.guestEmail = email;
  if (couponCode) body.couponCode = couponCode;
  const notes = clean(values.notes, 500);
  if (notes) body.notes = notes;
  return body;
}

/**
 * PUT /abandoned-checkouts/:key body: contact details typed so far plus the cart, so the shop
 * can follow up on checkouts that never finished.
 */
export function buildProgressBody({ values, lines, loggedIn }) {
  return {
    ...(loggedIn ? {} : { email: clean(values.email, 200).toLowerCase() }),
    fullName: clean(values.fullName, 120),
    phone: clean(values.phone, 20),
    city: canonicalCity(values.city),
    items: lines.map((l) => ({
      variantId: l.variantId,
      productName: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      image: l.image?.url ?? "",
    })),
  };
}

/** Anything worth following up on? (contact details typed, or a logged-in account) */
export const hasContact = (values, loggedIn) =>
  loggedIn || Boolean(clean(values.phone) || clean(values.email) || clean(values.fullName));
