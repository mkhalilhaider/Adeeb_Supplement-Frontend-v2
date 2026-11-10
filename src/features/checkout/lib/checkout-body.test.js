import { describe, expect, it } from "vitest";
import { buildCheckoutBody, buildProgressBody, hasContact } from "./checkout-body";
import { canonicalCity } from "./pk-cities";

const lines = [
  {
    variantId: "v1",
    name: "The Ripper",
    quantity: 2,
    unitPrice: 8200,
    image: { url: "https://img/x.webp" },
  },
];
const values = {
  email: " Ali@Example.com ",
  phone: "0300-123 4567",
  fullName: " Ali Khan ",
  addressLine1: "House 1, Street 2",
  addressLine2: "",
  city: " lahore ",
  notes: "",
  addressId: "",
};

describe("buildCheckoutBody", () => {
  it("sends a guest order with a tidy address and the guest email", () => {
    const body = buildCheckoutBody({ values, lines, loggedIn: false, sessionKey: "key-12345" });
    expect(body).toEqual({
      items: [{ variantId: "v1", quantity: 2, productName: "The Ripper" }],
      paymentMethod: "cod",
      checkoutSessionKey: "key-12345",
      guestEmail: "ali@example.com",
      shippingAddress: {
        fullName: "Ali Khan",
        phone: "03001234567",
        addressLine1: "House 1, Street 2",
        addressLine2: "",
        city: "Lahore",
        country: "Pakistan",
      },
    });
  });

  it("never sends guestEmail for a logged-in shopper", () => {
    const body = buildCheckoutBody({ values, lines, loggedIn: true, sessionKey: "key-12345" });
    expect(body.guestEmail).toBeUndefined();
    expect(body.shippingAddress.city).toBe("Lahore");
  });

  it("uses the saved address id instead of an inline address", () => {
    const body = buildCheckoutBody({
      values: { ...values, addressId: "a1" },
      lines,
      loggedIn: true,
      sessionKey: "key-12345",
    });
    expect(body.addressId).toBe("a1");
    expect(body.shippingAddress).toBeUndefined();
  });

  it("adds the coupon and notes only when present", () => {
    const body = buildCheckoutBody({
      values: { ...values, notes: " Call before coming " },
      lines,
      loggedIn: false,
      couponCode: "TEST10",
      sessionKey: "key-12345",
    });
    expect(body.couponCode).toBe("TEST10");
    expect(body.notes).toBe("Call before coming");
  });
});

describe("buildProgressBody", () => {
  it("carries contact details and the cart for follow-ups", () => {
    expect(buildProgressBody({ values, lines, loggedIn: false })).toEqual({
      email: "ali@example.com",
      fullName: "Ali Khan",
      phone: "0300-123 4567",
      city: "Lahore",
      items: [
        {
          variantId: "v1",
          productName: "The Ripper",
          quantity: 2,
          unitPrice: 8200,
          image: "https://img/x.webp",
        },
      ],
    });
  });

  it("leaves the email to the account when logged in", () => {
    expect(buildProgressBody({ values, lines, loggedIn: true }).email).toBeUndefined();
  });
});

describe("hasContact", () => {
  it("needs a phone, email or name from guests", () => {
    expect(hasContact({ phone: "", email: "", fullName: "" }, false)).toBe(false);
    expect(hasContact({ phone: "0300", email: "", fullName: "" }, false)).toBe(true);
    expect(hasContact({}, true)).toBe(true);
  });
});

describe("canonicalCity", () => {
  it("matches listed cities case-insensitively and keeps unlisted towns as typed", () => {
    expect(canonicalCity("  rahim  yar khan ")).toBe("Rahim Yar Khan");
    expect(canonicalCity("Chak 89")).toBe("Chak 89");
  });
});
