import { useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { controlClasses } from "../../../components/ui/Input";
import { cn } from "../../../lib/cn";
import { canonicalCity, matchCities, POPULAR_CITIES } from "../lib/pk-cities";

const MAX_SHOWN = 60;

/** The typed letters in bold inside a city name. */
function Highlight({ text, query }) {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <b className="font-extrabold">{text.slice(at, at + q.length)}</b>
      {text.slice(at + q.length)}
    </>
  );
}

/**
 * City field with a searchable list (ARIA combobox): popular cities first, filters as you type,
 * understands nicknames ("pindi", "isb"), and still accepts a town that isn't listed — the
 * last option is "Use '<what you typed>'". Arrow keys move, Enter picks, Escape closes.
 *
 * Spread Field's props and useForm's `field("city")` onto it, and pass `onPick` to store a
 * chosen city.
 *
 * @param {{ value: string, onChange: (e: any) => void, onPick: (city: string) => void,
 *   onBlur?: (e: any) => void, id?: string, name?: string, ref?: any }} props
 */
export function CityCombobox({ value, onChange, onPick, onBlur, ref, className, ...rest }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef(/** @type {HTMLUListElement|null} */ (null));

  const query = value ?? "";
  const cities = matchCities(query).slice(0, MAX_SHOWN);
  const typed = query.trim();
  const exact = typed && cities.some((c) => c.toLowerCase() === typed.toLowerCase());
  const options = typed && !exact ? [...cities, { custom: typed }] : cities;
  const showGroups = !typed;

  const pick = (city) => {
    onPick(canonicalCity(city));
    setOpen(false);
  };

  const move = (delta) => {
    if (!open) setOpen(true);
    const next = (active + delta + options.length) % options.length;
    setActive(next);
    listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter" && open && options.length) {
      event.preventDefault();
      const option = options[active];
      pick(typeof option === "string" ? option : option.custom);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const optionId = (i) => `${listId}-o${i}`;

  return (
    <div className={cn("relative", className)}>
      <input
        ref={ref}
        {...rest}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options.length ? optionId(active) : undefined}
        autoComplete="address-level2"
        placeholder="Search your city"
        value={query}
        onChange={(event) => {
          onChange(event);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          setOpen(false);
          onBlur?.(event);
        }}
        className={cn(controlClasses, "h-12 pr-10 pl-3")}
      />
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3 transition-transform",
          open && "rotate-180",
        )}
      />
      {open && options.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Cities"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-md border border-line bg-surface p-1.5 shadow-overlay"
        >
          {options.map((option, i) => {
            const custom = typeof option !== "string";
            const label = custom ? option.custom : option;
            return (
              <li key={custom ? "__custom" : label} role="presentation">
                {showGroups && i === 0 && (
                  <span className="block px-3 pt-2 pb-1 label-caps text-ink-3">Popular</span>
                )}
                {showGroups && i === POPULAR_CITIES.length && (
                  <span className="block px-3 pt-3 pb-1 label-caps text-ink-3">All cities A–Z</span>
                )}
                {/* Combobox pattern: the input keeps focus and handles the keys (aria-activedescendant),
                    so options are clicked, never focused. */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus */}
                <div
                  id={optionId(i)}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  // Keep focus in the input so the list doesn't close before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(label)}
                  onMouseMove={() => setActive(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-[15px]",
                    i === active && "bg-shelf",
                    custom && "mt-1 border-t border-line font-bold text-brand-ink",
                  )}
                >
                  {custom ? (
                    <span>Use “{label}” as my city</span>
                  ) : (
                    <span>
                      <Highlight text={label} query={typed} />
                    </span>
                  )}
                  {label === "Karachi" && !custom && (
                    <span className="text-[12px] font-bold text-success">Same-day delivery</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
