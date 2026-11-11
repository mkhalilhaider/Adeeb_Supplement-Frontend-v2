import { formatPkPhone, formatPrice } from "../../../lib/format";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const attrs = (a = {}) =>
  [a.flavor, a.weight, a.serving && `${a.serving} servings`].filter(Boolean).join(" · ");

/** Printable packing slip (own window, own styles — independent of the app's CSS). */
export function packingSlipHtml(order) {
  const a = order.shippingAddress ?? {};
  const rows = (order.items ?? [])
    .map(
      (i) =>
        `<tr><td>${esc(i.productName)}<br><small>${esc(attrs(i.attributes))} · ${esc(i.sku)}</small></td><td class="n">${i.quantity}</td><td class="n">${esc(formatPrice(i.lineTotal ?? i.unitPrice * i.quantity))}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Packing slip ${esc(order.orderNumber)}</title>
<style>
body{font:14px/1.45 system-ui,sans-serif;color:#111;margin:32px}
h1{font-size:20px;margin:0 0 4px} .muted{color:#555} table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{border-bottom:1px solid #ccc;padding:8px 4px;text-align:left;vertical-align:top} .n{text-align:right;white-space:nowrap}
.box{border:2px solid #111;padding:12px;margin-top:16px} .total{font-size:18px;font-weight:700}
</style></head><body>
<h1>Adeeb Supplement — ${esc(order.orderNumber)}</h1>
<div class="muted">${esc(new Date(order.createdAt).toLocaleString("en-PK"))} · ${esc(order.courierName ?? "")}</div>
<div class="box"><strong>${esc(a.fullName)}</strong><br>${esc(a.addressLine1)}${a.addressLine2 ? `<br>${esc(a.addressLine2)}` : ""}<br>${esc(a.city)}<br>${esc(formatPkPhone(a.phone))}</div>
<table><thead><tr><th>Item</th><th class="n">Qty</th><th class="n">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<p class="n">Subtotal ${esc(formatPrice(order.subtotal))}${order.discount ? ` · Discount −${esc(formatPrice(order.discount))}` : ""} · Delivery ${esc(order.shippingFee ? formatPrice(order.shippingFee) : "Free")}</p>
<p class="n total">Collect cash: ${esc(formatPrice(order.total))}</p>
${order.notes ? `<p><strong>Customer note:</strong> ${esc(order.notes)}</p>` : ""}
${order.trackingNumber ? `<p>Tracking: ${esc(order.trackingNumber)}</p>` : ""}
</body></html>`;
}

/** Open the slip in a new window and show the print dialog. */
export function printPackingSlip(order) {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return false;
  win.document.open();
  win.document.write(packingSlipHtml(order));
  win.document.close();
  win.focus();
  // Give the new window a moment to lay out the slip before the print dialog opens.
  setTimeout(() => win.print(), 300);
  return true;
}
