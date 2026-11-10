import { X } from "lucide-react";
import { formatPrice } from "../../../lib/format";
import { PRICE_PRESETS, SORTS } from "../lib/listing-params";

/** Native select: the OS picker is the best sort UI on phones. */
export function SortSelect({ value, onChange, id = "sort" }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-small text-ink-3 max-md:sr-only">
        Sort by
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 cursor-pointer appearance-none rounded-sm border border-line-strong bg-surface pr-8 pl-3 text-small font-semibold outline-none hover:border-ink-3 focus-visible:border-ink"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 fill-none stroke-ink-2 stroke-2"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>
    </div>
  );
}

function priceLabel(min, max) {
  const preset = PRICE_PRESETS.find((p) => p.min === min && p.max === max);
  if (preset) return preset.label;
  if (min != null && max != null) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (min != null) return `From ${formatPrice(min)}`;
  return `Up to ${formatPrice(max)}`;
}

/**
 * The filters in effect, each removable, plus "Clear all". Nothing renders when no filter is
 * active (the page's own category/brand isn't a removable filter).
 */
export function ActiveFilters({ state, base, category, brand, onChange, onClearAll }) {
  const chips = [];
  if (state.q) chips.push({ key: "q", label: `“${state.q}”`, patch: { q: undefined } });
  if (state.category && !base.category && category)
    chips.push({ key: "category", label: category.name, patch: { category: undefined } });
  if (state.brand && !base.brand && brand)
    chips.push({ key: "brand", label: brand.name, patch: { brand: undefined } });
  if (state.min != null || state.max != null)
    chips.push({
      key: "price",
      label: priceLabel(state.min, state.max),
      patch: { min: undefined, max: undefined },
    });
  if (state.featured)
    chips.push({ key: "featured", label: "Featured picks", patch: { featured: false } });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sr-only">Active filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.patch)}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-ink bg-surface pr-2 pl-3 text-small font-medium transition-colors hover:bg-ink hover:text-paper"
        >
          {chip.label}
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="h-8 px-2 text-small font-semibold underline underline-offset-4 hover:text-brand-ink"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
