/**
 * Real catalog packshots used by the homepage hero and the "Shop all" menu. Cloudinary's AI
 * background removal cuts each one out so it can stand on the dark hero; the two sizes used
 * below were generated once in advance and are served from Cloudinary's CDN cache.
 * Keep the transformation strings exactly as they are: a new size or format would make
 * Cloudinary process the image again (a few seconds on the first visit).
 */
const CLOUD = "https://res.cloudinary.com/ztiwmftk/image/upload";

/** @param {string} id @param {400|640} h */
export const cutoutSrc = (id, h) =>
  `${CLOUD}/e_background_removal/e_trim/f_webp,q_auto,h_${h}/adeeb-supplement/variants/${id}`;

/**
 * Left to right on the stage. `place` positions each pack (they overlap, the centre one in
 * front); `lead` is the centre pack and the LCP image; `from` hides a pack below that breakpoint.
 */
export const HERO_PACKS = [
  {
    id: "qz7bnwkscqumhccxxvh8",
    slug: "kevin-levrone-gold-creatine-unflavored-60-servings-in-pakistan",
    name: "Kevin Levrone Gold Creatine",
    height: "40%",
    place: { left: "1%" },
    from: "xl",
  },
  {
    id: "jv4yyhm8touiq3d9ucq8",
    slug: "dymatize-iso100-3-lb-42-servings-hydrolyzed-isolate-protein",
    name: "Dymatize ISO100",
    height: "58%",
    place: { left: "15%" },
  },
  {
    id: "j3fvjcuok3csqjt9cp0p",
    slug: "optimum-nutrition-gold-standard-100-whey-5-64-lb-80-servings",
    name: "Optimum Nutrition Gold Standard 100% Whey",
    brand: "Optimum Nutrition",
    short: "Gold Standard 100% Whey",
    height: "84%",
    place: { left: "50%", transform: "translateX(-50%)" },
    lead: true,
  },
  {
    id: "zitpb3rfe5gmiv9fzass",
    slug: "c4-original-pre-workout-50-servings",
    name: "Cellucor C4 Original",
    height: "48%",
    place: { right: "17%" },
  },
  {
    id: "jaotsscwebaoj7yuwjyi",
    slug: "muscletech-nitro-tech-ripped-4lbs",
    name: "MuscleTech Nitro-Tech Ripped",
    height: "58%",
    place: { right: "1%" },
    from: "sm",
  },
];

export const LEAD_PACK = HERO_PACKS.find((p) => p.lead);
