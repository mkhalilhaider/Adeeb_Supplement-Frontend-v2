/**
 * Join class names, skipping falsy values: cn("a", cond && "b", undefined) → "a b".
 * Components are written so a caller's `className` only adds layout (margins, width) and never
 * fights a variant's colors, so no class-merging library is needed.
 */
export function cn(...values) {
  return values.filter(Boolean).join(" ");
}
