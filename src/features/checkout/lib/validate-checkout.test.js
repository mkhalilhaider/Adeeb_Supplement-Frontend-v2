import { describe, expect, it } from "vitest";
import { validateCheckout } from "./validate-checkout";

const empty = {
  email: "",
  phone: "",
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  notes: "",
  addressId: "",
};
const filled = {
  ...empty,
  phone: "0300 1234567",
  fullName: "Ali Khan",
  addressLine1: "House 1, Street 2",
  city: "Lahore",
};

describe("validateCheckout", () => {
  it("asks guests for phone, name, address and city", () => {
    expect(Object.keys(validateCheckout(empty, { loggedIn: false, savedIds: [] }))).toEqual([
      "phone",
      "fullName",
      "addressLine1",
      "city",
    ]);
  });

  it("accepts a complete guest form, email optional", () => {
    expect(validateCheckout(filled, { loggedIn: false, savedIds: [] })).toEqual({});
  });

  it("rejects numbers that aren't Pakistani mobiles and malformed emails", () => {
    const errors = validateCheckout(
      { ...filled, phone: "042 35761234", email: "ali@" },
      { loggedIn: false, savedIds: [] },
    );
    expect(errors.phone).toMatch(/Pakistani mobile/);
    expect(errors.email).toMatch(/valid email/);
  });

  it("needs nothing else when a logged-in shopper picks a saved address", () => {
    expect(
      validateCheckout({ ...empty, addressId: "a1" }, { loggedIn: true, savedIds: ["a1"] }),
    ).toEqual({});
  });

  it("checks the new address (and its phone) when a logged-in shopper types one", () => {
    expect(
      Object.keys(
        validateCheckout({ ...empty, addressId: "new" }, { loggedIn: true, savedIds: ["a1"] }),
      ),
    ).toEqual(["phone", "fullName", "addressLine1", "city"]);
  });

  it("ignores the email field for logged-in shoppers", () => {
    expect(
      validateCheckout({ ...filled, email: "nope" }, { loggedIn: true, savedIds: [] }),
    ).toEqual({});
  });
});
