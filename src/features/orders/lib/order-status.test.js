import { describe, expect, it } from "vitest";
import { parseOrderIdentifier, stepIndex } from "./order-status";

describe("parseOrderIdentifier", () => {
  it("normalises full order numbers however they are typed", () => {
    expect(parseOrderIdentifier("SUP-20261110-0001")).toBe("SUP-20261110-0001");
    expect(parseOrderIdentifier(" #sup-20261110-0001 ")).toBe("SUP-20261110-0001");
    expect(parseOrderIdentifier("20261110-0001")).toBe("SUP-20261110-0001");
    expect(parseOrderIdentifier("sup 20261110 0001")).toBe("SUP-20261110-0001");
  });

  it("accepts the order id from emails", () => {
    expect(parseOrderIdentifier("6AF316E6C1755AAB5AD9DBDE")).toBe("6af316e6c1755aab5ad9dbde");
  });

  it("refuses partial numbers that could match someone else's order", () => {
    expect(parseOrderIdentifier("0001")).toBeNull();
    expect(parseOrderIdentifier("1110-0001")).toBeNull();
    expect(parseOrderIdentifier("SUP-.*")).toBeNull();
    expect(parseOrderIdentifier("")).toBeNull();
  });
});

describe("stepIndex", () => {
  it("places each status on the progress line", () => {
    expect(stepIndex("pending")).toBe(0);
    expect(stepIndex("delivered")).toBe(4);
    expect(stepIndex("cancelled")).toBe(-1);
  });
});
