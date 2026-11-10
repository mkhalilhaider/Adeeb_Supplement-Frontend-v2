import { useId } from "react";
import { cn } from "../../../lib/cn";
import { tidyAttribute } from "../../../lib/format";
import { optionState, pickVariant } from "../lib/variant-matrix";

/**
 * One chip group per attribute that varies (flavour, size, servings). Native radios: arrow keys
 * move between options and screen readers announce "Flavour, Chocolate, 1 of 4".
 * Sold-out options stay selectable (so shoppers can see them) but are struck through.
 *
 * @param {{ variants: any[], dimensions: ReturnType<import("../lib/variant-matrix").pickerDimensions>, current: any, onChange: (variant: any) => void }} props
 */
export function VariantPicker({ variants, dimensions, current, onChange }) {
  const id = useId();
  const dimKeys = dimensions.map((d) => d.key);

  return (
    <div className="flex flex-col gap-5">
      {dimensions.map((dim) => {
        const selectedLabel = tidyAttribute(current?.attributes?.[dim.key]);
        return (
          <fieldset key={dim.key}>
            <legend className="mb-2.5 text-small">
              <span className="font-semibold">{dim.label}:</span>{" "}
              <span className="text-ink-2">{selectedLabel}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {dim.options.map((option) => {
                const state = optionState(variants, current, dim.key, option.key);
                const inputId = `${id}-${dim.key}-${option.key}`;
                return (
                  <label
                    key={option.key}
                    htmlFor={inputId}
                    className={cn(
                      "relative inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-3.5 text-small font-medium transition-colors",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                      state === "selected" && "border-ink bg-ink text-paper",
                      state === "available" && "border-line-strong bg-surface hover:border-ink",
                      state === "soldout" &&
                        "border-line bg-surface text-ink-3 line-through decoration-1",
                    )}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={`${id}-${dim.key}`}
                      value={option.key}
                      checked={state === "selected"}
                      onChange={() =>
                        onChange(pickVariant(variants, current, dimKeys, dim.key, option.key))
                      }
                      className="sr-only"
                    />
                    {option.label}
                    {state === "soldout" && <span className="sr-only"> (sold out)</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
