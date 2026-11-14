/**
 * The homepage's built-in wording, used until something is saved in Admin → Homepage content
 * (and as that page's starting values).
 */

/** Category slug → goal title on the "Shop by goal" tiles, in tile order. */
export const GOALS = {
  protein: "Build muscle",
  creatine: "Strength & power",
  preworkout: "Energy & focus",
  "mass-gainer": "Gain size",
  "fat-burner": "Get lean",
  "bcaa-eaa": "Recover faster",
  "health-recovery": "Daily health",
};
export const GOAL_ORDER = Object.keys(GOALS);

/** The dark spotlight band after Best sellers. */
export const DEFAULT_SPOTLIGHT = { slug: "creatine", title: "Strength starts with creatine." };
