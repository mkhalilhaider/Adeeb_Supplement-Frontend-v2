const number = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** 8200 → "Rs 8,200". Whole rupees only (backend stores PKR integers). */
export function formatPrice(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  return `Rs ${number.format(Math.round(value))}`;
}

/** Percentage saved, rounded down so we never overstate a discount. 9000→8200 = 8 */
export function discountPercent(price, salePrice) {
  const p = Number(price);
  const s = Number(salePrice);
  if (!Number.isFinite(p) || !Number.isFinite(s) || s <= 0 || s >= p) return 0;
  return Math.floor(((p - s) / p) * 100);
}

const dateFmt = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFmt.format(date);
}

export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateTimeFmt.format(date);
}

/** Pakistani mobile numbers: 03XXXXXXXXX or +923XXXXXXXXX (spaces/dashes allowed). */
export function normalizePkPhone(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (/^03\d{9}$/.test(digits)) return digits;
  if (/^923\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  return null;
}

/** "03102987869" → "0310 2987869" */
export function formatPkPhone(input) {
  const phone = normalizePkPhone(input);
  return phone ? `${phone.slice(0, 4)} ${phone.slice(4)}` : String(input ?? "");
}

/** Display-only tidy-up of free-text attributes: "5lbs" → "5 lbs", "DARK GRAPE" → "Dark Grape". */
export function tidyAttribute(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const spaced = text.replace(/(\d)([a-zA-Z])/g, "$1 $2").replace(/\s+/g, " ");
  return spaced
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Kg|Lbs?|G|Ml)\b/g, (unit) => unit.toLowerCase());
}
