import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/cn";

/** A row of equal buttons for a small set of choices (radio group). */
export function Choice({ label, value, options, onChange }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-small font-medium">{label}</legend>
      <div className="flex overflow-hidden rounded-md border border-line-strong">
        {options.map(([v, text]) => (
          <label
            key={v}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center border-r border-line-strong px-2 py-2.5 text-center text-small font-semibold last:border-r-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-ink",
              value === v ? "bg-ink text-white" : "bg-surface hover:bg-shelf",
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={label}
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
            />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Number input with a unit after it. */
export function NumberField({ label, hint, value, onChange, min, max, unit }) {
  return (
    <Field label={label} hint={hint}>
      {(f) => (
        <div className="flex items-center gap-2">
          <Input
            {...f}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-24"
          />
          <span className="text-small text-ink-2">{unit}</span>
        </div>
      )}
    </Field>
  );
}
