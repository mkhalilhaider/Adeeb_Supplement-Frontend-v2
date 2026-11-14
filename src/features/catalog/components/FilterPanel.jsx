import { useId, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Checkbox, Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/cn";
import { matchPricePreset, PRICE_PRESETS } from "../lib/listing-params";

/** Native radio styled as a list row: big touch target, real radio semantics. */
function RadioRow({ name, value, checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-sm py-1.5 text-small hover:text-ink">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-line-strong bg-surface checked:border-[5px] checked:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
      <span className="text-ink-2 peer-checked:font-semibold peer-checked:text-ink">
        {children}
      </span>
    </label>
  );
}

function Section({ legend, children }) {
  return (
    <fieldset className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <legend className="float-left mb-3 w-full label-caps text-ink">{legend}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

/** Custom price range; commits on "Apply" so typing doesn't fire a request per keystroke. */
function PriceRange({ min, max, onApply }) {
  const id = useId();
  const [draft, setDraft] = useState(null);
  const values = draft ?? { min: min ?? "", max: max ?? "" };
  const toNum = (v) => {
    const n = Number.parseInt(String(v).replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  return (
    <form
      className="mt-3 flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onApply({ min: toNum(values.min), max: toNum(values.max) });
        setDraft(null);
      }}
    >
      <div className="flex-1">
        <label htmlFor={`${id}-min`} className="text-[12px] text-ink-3">
          Min (Rs)
        </label>
        <Input
          id={`${id}-min`}
          inputMode="numeric"
          value={values.min}
          onChange={(e) => setDraft({ ...values, min: e.target.value })}
          className="mt-1 !h-10"
        />
      </div>
      <div className="flex-1">
        <label htmlFor={`${id}-max`} className="text-[12px] text-ink-3">
          Max (Rs)
        </label>
        <Input
          id={`${id}-max`}
          inputMode="numeric"
          value={values.max}
          onChange={(e) => setDraft({ ...values, max: e.target.value })}
          className="mt-1 !h-10"
        />
      </div>
      <Button type="submit" variant="outline" size="sm" className="!h-10">
        Apply
      </Button>
    </form>
  );
}

/**
 * Filters the backend supports: one category, one brand, a price range, featured.
 * Controlled: `onChange(patch)` either applies straight away (desktop sidebar) or updates a
 * draft that the mobile sheet applies on "Show results".
 *
 * @param {object} props
 * @param {import("../lib/listing-params").ListingState} props.state
 * @param {{ category?: string, brand?: string }} props.base  The page's own dimension (not filterable)
 * @param {{ categories: any[], brands: any[] }} props.taxonomy
 * @param {(patch: Partial<import("../lib/listing-params").ListingState>) => void} props.onChange
 * @param {string} [props.idPrefix]  Keeps radio names unique when two panels exist
 */
export function FilterPanel({ state, base, taxonomy, onChange, idPrefix = "f", className }) {
  const [brandQuery, setBrandQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const preset = matchPricePreset(state);
  const currentCategory = base.category ?? state.category;
  // On a category page the category is the page itself: picking another opens that page,
  // keeping the other filters (brand, price, sort) and starting again from page 1.
  const pickCategory = (slug) => {
    if (!base.category) return onChange({ category: slug || undefined });
    const params = new URLSearchParams(location.search);
    params.delete("page");
    params.delete("category");
    const qs = params.toString();
    navigate(`${slug ? `/category/${slug}` : "/shop"}${qs ? `?${qs}` : ""}`);
  };
  const hasCustomPrice = (state.min != null || state.max != null) && !preset;
  const brands = brandQuery
    ? taxonomy.brands.filter((b) => b.name.toLowerCase().includes(brandQuery.toLowerCase()))
    : taxonomy.brands;

  return (
    <div className={cn("flex flex-col", className)}>
      <Section legend="Category">
        <RadioRow
          name={`${idPrefix}-category`}
          value=""
          checked={!currentCategory}
          onChange={() => pickCategory("")}
        >
          All categories
        </RadioRow>
        {taxonomy.categories.map((c) => (
          <RadioRow
            key={c._id}
            name={`${idPrefix}-category`}
            value={c.slug}
            checked={currentCategory === c.slug}
            onChange={() => pickCategory(c.slug)}
          >
            {c.name}
          </RadioRow>
        ))}
      </Section>

      {!base.brand && (
        <Section legend="Brand">
          {taxonomy.brands.length > 8 && (
            <Input
              type="search"
              aria-label="Find a brand"
              placeholder="Find a brand"
              value={brandQuery}
              onChange={(e) => setBrandQuery(e.target.value)}
              className="mb-2 !h-10"
            />
          )}
          <div>
            <RadioRow
              name={`${idPrefix}-brand`}
              value=""
              checked={!state.brand}
              onChange={() => onChange({ brand: undefined })}
            >
              All brands
            </RadioRow>
            {brands.map((b) => (
              <RadioRow
                key={b._id}
                name={`${idPrefix}-brand`}
                value={b.slug}
                checked={state.brand === b.slug}
                onChange={() => onChange({ brand: b.slug })}
              >
                {b.name}
              </RadioRow>
            ))}
            {brands.length === 0 && <p className="py-2 text-small text-ink-3">No brand matches.</p>}
          </div>
        </Section>
      )}

      <Section legend="Price">
        <RadioRow
          name={`${idPrefix}-price`}
          value=""
          checked={state.min == null && state.max == null}
          onChange={() => onChange({ min: undefined, max: undefined })}
        >
          Any price
        </RadioRow>
        {PRICE_PRESETS.map((p) => (
          <RadioRow
            key={p.id}
            name={`${idPrefix}-price`}
            value={p.id}
            checked={preset === p.id}
            onChange={() => onChange({ min: p.min, max: p.max })}
          >
            {p.label}
          </RadioRow>
        ))}
        <PriceRange
          key={`${state.min}-${state.max}`}
          min={hasCustomPrice ? state.min : undefined}
          max={hasCustomPrice ? state.max : undefined}
          onApply={({ min, max }) => onChange({ min, max })}
        />
      </Section>

      <Section legend="Highlights">
        <Checkbox
          id={`${idPrefix}-featured`}
          label="Featured picks"
          description="Hand-picked by our team"
          checked={state.featured}
          onChange={(e) => onChange({ featured: e.target.checked })}
        />
      </Section>
    </div>
  );
}
