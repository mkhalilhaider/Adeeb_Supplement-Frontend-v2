/**
 * Per-visit checkout state in sessionStorage (this tab only — it holds personal details, so
 * never localStorage): the abandoned-checkout session key, the form draft, the last order.
 */
const KEY = "adeeb.checkout-key";
const DRAFT = "adeeb.checkout-draft";
const LAST_ORDER = "adeeb.last-order";

const storage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

function newKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Same key for the whole visit (the backend accepts ^[a-zA-Z0-9-]{8,64}$). */
export function checkoutKey() {
  const s = storage();
  const existing = s?.getItem(KEY);
  if (existing && /^[a-zA-Z0-9-]{8,64}$/.test(existing)) return existing;
  const key = newKey();
  s?.setItem(KEY, key);
  return key;
}

export function readDraft() {
  try {
    return JSON.parse(storage()?.getItem(DRAFT) ?? "null");
  } catch {
    return null;
  }
}

export function writeDraft(values) {
  try {
    storage()?.setItem(DRAFT, JSON.stringify(values));
  } catch {
    /* storage full or blocked: the draft is only a convenience */
  }
}

/** After an order: remember it for the confirmation page, start the next visit fresh. */
export function finishCheckout(order) {
  const s = storage();
  s?.removeItem(KEY);
  s?.removeItem(DRAFT);
  try {
    s?.setItem(LAST_ORDER, JSON.stringify(order));
  } catch {
    /* the confirmation page falls back to the public tracking lookup */
  }
}

/** The order last placed in this tab (confirmation page after a reload). */
export function readLastOrder() {
  try {
    return JSON.parse(storage()?.getItem(LAST_ORDER) ?? "null");
  } catch {
    return null;
  }
}
