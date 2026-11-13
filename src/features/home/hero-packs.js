/**
 * Real catalog packshots used by the homepage hero, the "Shop all" menu and a few bands.
 * Cloudinary's AI background removal cuts each one out so it can stand on dark backgrounds;
 * the two sizes used below were generated once in advance and are served from Cloudinary's
 * CDN cache. Keep the transformation strings exactly as they are: a new size or format would
 * make Cloudinary process the image again (a few seconds on the first visit).
 */
const CLOUD = "https://res.cloudinary.com/ztiwmftk/image/upload";

/** @param {string} id @param {400|640} h */
export const cutoutSrc = (id, h) =>
  `${CLOUD}/e_background_removal/e_trim/f_webp,q_auto,h_${h}/adeeb-supplement/variants/${id}`;

/**
 * Hero carousel order. `w` is each pack's width ÷ height (keeps the row centred while the
 * images load). `lead` starts at the front and is the LCP image.
 */
export const HERO_PACKS = [
  {
    id: "qz7bnwkscqumhccxxvh8",
    slug: "kevin-levrone-gold-creatine-unflavored-60-servings-in-pakistan",
    name: "Kevin Levrone Gold Creatine",
    brand: "Kevin Levrone",
    short: "Gold Creatine",
    w: 0.73,
  },
  {
    id: "jv4yyhm8touiq3d9ucq8",
    slug: "dymatize-iso100-3-lb-42-servings-hydrolyzed-isolate-protein",
    name: "Dymatize ISO100",
    brand: "Dymatize",
    short: "ISO100 Hydrolyzed Isolate",
    w: 0.65,
  },
  {
    id: "j3fvjcuok3csqjt9cp0p",
    slug: "optimum-nutrition-gold-standard-100-whey-5-64-lb-80-servings",
    name: "Optimum Nutrition Gold Standard 100% Whey",
    brand: "Optimum Nutrition",
    short: "Gold Standard 100% Whey",
    w: 0.86,
    lead: true,
  },
  {
    id: "zitpb3rfe5gmiv9fzass",
    slug: "c4-original-pre-workout-50-servings",
    name: "Cellucor C4 Original",
    brand: "Cellucor",
    short: "C4 Original Pre-Workout",
    w: 0.91,
  },
  {
    id: "jaotsscwebaoj7yuwjyi",
    slug: "muscletech-nitro-tech-ripped-4lbs",
    name: "MuscleTech Nitro-Tech Ripped",
    brand: "MuscleTech",
    short: "Nitro-Tech Ripped",
    w: 0.71,
  },
];

export const LEAD_PACK = HERO_PACKS.find((p) => p.lead);
export const LEAD_INDEX = HERO_PACKS.indexOf(LEAD_PACK);
