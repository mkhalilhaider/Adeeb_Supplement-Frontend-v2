import { describe, expect, it } from "vitest";
import { cloudinarySrcSet, cloudinaryUrl, cloudinaryVideoPoster } from "./cloudinary";

const IMG =
  "https://res.cloudinary.com/demo/image/upload/v1792940732/adeeb-supplement/variants/abc.webp";

describe("cloudinaryUrl", () => {
  it("inserts transformations after /upload/ and keeps the version", () => {
    expect(cloudinaryUrl(IMG, { w: 480 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_480/v1792940732/adeeb-supplement/variants/abc.webp",
    );
  });
  it("adds trimming as its own step", () => {
    expect(cloudinaryUrl(IMG, { w: 320, trim: true })).toContain(
      "/upload/e_trim:8/f_auto,q_auto,c_limit,w_320/",
    );
  });
  it("leaves non-Cloudinary URLs untouched", () => {
    expect(cloudinaryUrl("/logo.png", { w: 100 })).toBe("/logo.png");
  });
});

describe("cloudinarySrcSet", () => {
  it("lists each width with a w descriptor", () => {
    const set = cloudinarySrcSet(IMG, [160, 320]);
    expect(set).toContain("w_160/v1792940732");
    expect(set).toMatch(/ 160w, .* 320w$/);
  });
});

describe("cloudinaryVideoPoster", () => {
  it("turns a video URL into a sized jpg poster", () => {
    expect(
      cloudinaryVideoPoster("https://res.cloudinary.com/demo/video/upload/v1/reels/x.mp4", {
        w: 400,
      }),
    ).toBe("https://res.cloudinary.com/demo/video/upload/f_auto,q_auto,w_400/v1/reels/x.jpg");
  });
});
