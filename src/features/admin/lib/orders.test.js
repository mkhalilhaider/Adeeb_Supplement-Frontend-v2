import { describe, expect, it } from "vitest";
import { canBookCourier, customerWhatsApp, nextStatuses } from "./orders";

describe("nextStatuses", () => {
  it("follows the backend's order state machine", () => {
    expect(nextStatuses("pending")).toEqual([
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]);
    expect(nextStatuses("shipped")).toEqual(["delivered"]);
    expect(nextStatuses("delivered")).toEqual([]);
    expect(nextStatuses("cancelled")).toEqual([]);
  });
});

describe("canBookCourier", () => {
  const order = { deliveryType: "national_courier", orderStatus: "confirmed", trackingNumber: "" };
  it("offers booking only for unbooked, open courier orders", () => {
    expect(canBookCourier(order)).toBe(true);
    expect(canBookCourier({ ...order, trackingNumber: "IW-1" })).toBe(false);
    expect(canBookCourier({ ...order, orderStatus: "cancelled" })).toBe(false);
    expect(canBookCourier({ ...order, deliveryType: "local_rider" })).toBe(false);
  });
});

describe("customerWhatsApp", () => {
  it("builds an international wa.me link from a local mobile", () => {
    const link = customerWhatsApp({
      orderNumber: "SUP-1",
      shippingAddress: { fullName: "Ali Khan", phone: "0300 1234567" },
    });
    expect(link).toMatch(/^https:\/\/wa\.me\/923001234567\?text=/);
    expect(decodeURIComponent(link)).toContain("Ali");
  });
  it("returns null for numbers WhatsApp can't use", () => {
    expect(customerWhatsApp({ shippingAddress: { phone: "021 1234567" } })).toBeNull();
  });
});
