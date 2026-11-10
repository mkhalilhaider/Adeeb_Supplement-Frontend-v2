import { describe, expect, it } from "vitest";
import { addressBody, addressFormValues, validateAddress } from "./address";

const good = {
  fullName: " Sara Ahmed ",
  phone: "+92 321 7654321",
  addressLine1: "House 4, Street 9, F-8/3",
  addressLine2: "",
  city: "islamabad",
  postalCode: "44000",
};

describe("validateAddress", () => {
  it("accepts a complete address", () => {
    expect(validateAddress(good)).toEqual({});
  });

  it("flags every missing or malformed field", () => {
    expect(Object.keys(validateAddress(addressFormValues(null)))).toEqual([
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "postalCode",
    ]);
    expect(validateAddress({ ...good, postalCode: "4400" }).postalCode).toMatch(/5-digit/);
    expect(validateAddress({ ...good, phone: "051 1234567" }).phone).toMatch(/Pakistani mobile/);
  });
});

describe("addressBody", () => {
  it("sends only accepted fields, tidied", () => {
    expect(addressBody(good)).toEqual({
      fullName: "Sara Ahmed",
      phone: "03217654321",
      addressLine1: "House 4, Street 9, F-8/3",
      addressLine2: "",
      city: "Islamabad",
      postalCode: "44000",
      country: "Pakistan",
    });
  });
});
