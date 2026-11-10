import { describe, expect, it } from "vitest";
import { loginPath, safeReturnTo } from "./return-to";

describe("safeReturnTo", () => {
  it("keeps internal storefront paths", () => {
    expect(safeReturnTo("/checkout")).toBe("/checkout");
    expect(safeReturnTo("/account/orders?page=2")).toBe("/account/orders?page=2");
  });

  it("refuses other sites and odd inputs", () => {
    expect(safeReturnTo("//evil.com")).toBe("/account");
    expect(safeReturnTo("/\\evil.com")).toBe("/account");
    expect(safeReturnTo("https://evil.com")).toBe("/account");
    expect(safeReturnTo("javascript:alert(1)")).toBe("/account");
    expect(safeReturnTo(null)).toBe("/account");
  });

  it("never returns to the admin area or another auth page", () => {
    expect(safeReturnTo("/admin")).toBe("/account");
    expect(safeReturnTo("/admin/orders")).toBe("/account");
    expect(safeReturnTo("/login?returnTo=/x")).toBe("/account");
    expect(safeReturnTo("/auth/google/callback")).toBe("/account");
    expect(safeReturnTo("/administrator-tips", "/")).toBe("/administrator-tips");
  });
});

describe("loginPath", () => {
  it("carries a safe return path", () => {
    expect(loginPath("/checkout")).toBe("/login?returnTo=%2Fcheckout");
    expect(loginPath("//evil.com")).toBe("/login");
    expect(loginPath("/checkout", "/register")).toBe("/register?returnTo=%2Fcheckout");
  });
});
