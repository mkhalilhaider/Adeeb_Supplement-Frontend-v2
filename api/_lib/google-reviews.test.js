import { describe, expect, it } from "vitest";
import { isValidPageToken, mapSerpReviews, serpUrl } from "./google-reviews.js";

// Shape of a SerpAPI google_maps_reviews response (test fixture, not real reviews).
const payload = {
  place_info: { title: "Test Store", rating: 4.8, reviews: 57 },
  reviews: [
    {
      review_id: "r1",
      rating: 5,
      date: "2 weeks ago",
      iso_date: "2026-10-27T10:00:00Z",
      snippet: "Fallback   text",
      extracted_snippet: { original: "Original  text\nwith newline" },
      link: "https://www.google.com/maps/reviews/data=abc",
      user: { name: "Test Person", thumbnail: "https://lh3.googleusercontent.com/a/xyz" },
    },
    {
      rating: 4,
      date: "a month ago",
      snippet: "",
      link: "https://evil.example/phish",
      user: { name: "Second Person", thumbnail: "https://evil.example/avatar.png" },
    },
    { rating: 0, snippet: "invalid rating" },
  ],
  serpapi_pagination: { next_page_token: "CAESBkVnSUlDZw==" },
};

describe("mapSerpReviews", () => {
  it("keeps only what the slider needs, tidied", () => {
    const result = mapSerpReviews(payload, { dataId: "0x1:0x2" });
    expect(result.rating).toBe(4.8);
    expect(result.total).toBe(57);
    expect(result.next).toBe("CAESBkVnSUlDZw==");
    expect(result.placeUrl).toContain("0x1:0x2");
    expect(result.reviews).toHaveLength(2);
    expect(result.reviews[0]).toEqual({
      id: "r1",
      author: "Test Person",
      avatar: "https://lh3.googleusercontent.com/a/xyz",
      rating: 5,
      date: "2 weeks ago",
      text: "Original text with newline",
      link: "https://www.google.com/maps/reviews/data=abc",
    });
  });

  it("drops links and avatars that don't point at Google", () => {
    const [, second] = mapSerpReviews(payload, { dataId: "x" }).reviews;
    expect(second.link).toBeUndefined();
    expect(second.avatar).toBeUndefined();
  });

  it("copes with an empty or failed payload", () => {
    expect(mapSerpReviews({}, { dataId: "x" })).toMatchObject({ reviews: [], next: null });
  });
});

describe("page tokens and URLs", () => {
  it("accepts SerpAPI tokens and refuses anything else", () => {
    expect(isValidPageToken("CAESBkVnSUlDZw==")).toBe(true);
    expect(isValidPageToken("a&api_key=steal")).toBe(false);
    expect(isValidPageToken("")).toBe(false);
  });

  it("asks for more reviews per page only after the first", () => {
    expect(serpUrl({ apiKey: "k", dataId: "d" })).not.toContain("num=");
    expect(serpUrl({ apiKey: "k", dataId: "d", pageToken: "t" })).toContain("num=12");
  });
});

describe("Google Places source", () => {
  it("maps details/text-search payloads to the slider shape", async () => {
    const { mapPlacesReviews } = await import("./google-reviews.js");
    const place = {
      rating: 4.9,
      userRatingCount: 120,
      googleMapsUri: "https://maps.google.com/?cid=1",
      reviews: [
        {
          name: "places/x/reviews/1",
          rating: 5,
          relativePublishTimeDescription: "a week ago",
          text: { text: "Translated" },
          originalText: { text: "Original  words" },
          googleMapsUri: "https://www.google.com/maps/reviews/data=1",
          authorAttribution: {
            displayName: "Test Person",
            photoUri: "https://lh3.googleusercontent.com/a/p",
          },
        },
      ],
    };
    for (const payload of [place, { places: [place] }]) {
      const result = mapPlacesReviews(payload);
      expect(result).toMatchObject({ rating: 4.9, total: 120, next: null });
      expect(result.reviews[0]).toEqual({
        id: "places/x/reviews/1",
        author: "Test Person",
        avatar: "https://lh3.googleusercontent.com/a/p",
        rating: 5,
        date: "a week ago",
        text: "Original words",
        link: "https://www.google.com/maps/reviews/data=1",
      });
    }
    expect(mapPlacesReviews({ places: [] })).toBeNull();
  });

  it("finds a key under any of its usual names", async () => {
    const { firstEnv, SERPAPI_KEY_NAMES } = await import("./google-reviews.js");
    expect(firstEnv({ SERPAPI_KEY: " k1 " }, SERPAPI_KEY_NAMES)).toBe("k1");
    expect(firstEnv({ SERPAPI_API_KEY: "k2", SERPAPI_KEY: "k1" }, SERPAPI_KEY_NAMES)).toBe("k2");
    expect(firstEnv({}, SERPAPI_KEY_NAMES)).toBe("");
  });
});
