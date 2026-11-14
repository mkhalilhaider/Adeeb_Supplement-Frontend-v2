/**
 * Business facts shown across the site. Single source of truth — never hard-code these in
 * components. Trust claims below were confirmed by the business owner.
 */
export const site = Object.freeze({
  name: "Adeeb Supplement",
  shortName: "Adeeb",
  tagline: "Authentic sports nutrition, delivered across Pakistan.",
  currency: "PKR",
  locale: "en-PK",

  contact: {
    phone: "03000447870",
    phoneDisplay: "0300 0447870",
    phoneIntl: "+923000447870",
    whatsapp: "923000447870",
    email: "adeebsupplement@gmail.com",
  },

  store: {
    label: "Store & warehouse",
    address: "Karim Square, Block 13A, near Hassan Square, Gulshan-e-Iqbal, Karachi",
    area: "Gulshan-e-Iqbal, Karachi",
    city: "Karachi",
    mapsUrl:
      "https://www.google.com/maps/place/Adeeb+supplement/@24.9021552,67.0739073,17z/data=!3m1!4b1!4m6!3m5!1s0x3eb33f006bebfe79:0xf3122b83a6454335!8m2!3d24.9021552!4d67.0739073!16s%2Fg%2F11nvjhbc_m",
  },

  social: {
    instagram: "https://www.instagram.com/adeebsupplement/",
    facebook: "https://www.facebook.com/p/Adeeb-Supplement-61592745376678/",
    tiktok: "https://www.tiktok.com/@adeeb.supplement",
    youtube: "https://www.youtube.com/@adeebsupplement",
  },

  /** Confirmed by the owner: authentic brands, same-day Karachi, COD nationwide, Karachi store. */
  trust: [
    { id: "authentic", title: "Authentic brands", detail: "Sourced, never repacked" },
    {
      id: "sameday",
      title: "Same-day delivery in Karachi",
      detail: "Karachi riders, delivered today",
    },
    {
      id: "cod",
      title: "Cash on delivery nationwide",
      detail: "Pay when it arrives, anywhere in Pakistan",
    },
    { id: "store", title: "Walk-in store", detail: "Gulshan-e-Iqbal, Karachi" },
  ],

  /** Footer "top 5" lists (most products first). Slugs, so renames in admin don't break them. */
  footer: {
    categories: ["protein", "creatine", "preworkout", "health-recovery", "fat-burner"],
    brands: ["muscletech", "optimum-nutrition", "kevin-leverone", "cellucor", "rule-1"],
  },

  google: {
    /** "See all on Google": the shop's Google Maps listing. */
    reviewsUrl:
      "https://www.google.com/maps/place/Adeeb+supplement/@24.9021552,67.0739073,17z/data=!4m8!3m7!1s0x3eb33f006bebfe79:0xf3122b83a6454335!8m2!3d24.9021552!4d67.0739073!9m1!1b1",
    /**
     * "Write a review on Google". Best: the owner's own "Ask for reviews" link from Google
     * Business Profile (g.page/r/…/review). Until it's set, the listing opens and the customer
     * taps "Write a review" there.
     */
    writeReviewUrl:
      "https://www.google.com/maps/place/Adeeb+supplement/@24.9021552,67.0739073,17z/data=!4m8!3m7!1s0x3eb33f006bebfe79:0xf3122b83a6454335!8m2!3d24.9021552!4d67.0739073!9m1!1b1",
    /** Embedded map (no API key needed). */
    mapEmbedUrl:
      "https://maps.google.com/maps?q=Adeeb%20Supplement%2C%20Gulshan-e-Iqbal%2C%20Karachi&ll=24.9021552,67.0739073&z=16&output=embed",
  },
});

/** wa.me link with an optional pre-filled message. */
export function whatsappLink(message = "") {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${site.contact.whatsapp}${text}`;
}
