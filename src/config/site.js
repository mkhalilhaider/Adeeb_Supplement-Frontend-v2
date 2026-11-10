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
    phone: "03102987869",
    phoneDisplay: "0310 2987869",
    phoneIntl: "+923102987869",
    whatsapp: "923102987869",
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

  /** Confirmed by the owner: authentic brands, COD, nationwide delivery, Karachi store. */
  trust: [
    { id: "authentic", title: "Authentic brands", detail: "Sourced, never repacked" },
    { id: "cod", title: "Cash on delivery", detail: "Pay when it arrives" },
    { id: "delivery", title: "Nationwide delivery", detail: "Karachi riders & courier" },
    { id: "store", title: "Walk-in store", detail: "Gulshan-e-Iqbal, Karachi" },
  ],
});

/** wa.me link with an optional pre-filled message. */
export function whatsappLink(message = "") {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${site.contact.whatsapp}${text}`;
}
