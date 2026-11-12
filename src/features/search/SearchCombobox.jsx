import { useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, Clock, Search, X } from "lucide-react";
import { CloudImage } from "../../components/ui/CloudImage";
import { Price } from "../../components/ui/Price";
import { Spinner } from "../../components/ui/Spinner";
import { cn } from "../../lib/cn";
import { useOutsideClick } from "../../lib/hooks";
import { useTaxonomy } from "../catalog/useTaxonomy";
import { useRecentSearches } from "./recent-searches";
import { useSearchSuggestions } from "./useSearchSuggestions";

/**
 * Search box with suggestions (ARIA combobox + listbox).
 * - "inline": header field on desktop; the panel opens on focus and closes on blur/Esc.
 * - "overlay": inside the mobile full-screen search; the panel is always shown.
 *
 * Keyboard: ↑/↓ move through every suggestion, Enter opens the highlighted one (or searches
 * for the typed text), Esc closes.
 *
 * @param {{ variant?: "inline"|"overlay", onDone?: () => void, focusOnMount?: boolean, initialTerm?: string }} props
 */
export function SearchCombobox({
  variant = "inline",
  onDone,
  focusOnMount = false,
  initialTerm = "",
}) {
  const id = useId();
  const listId = `${id}-list`;
  const navigate = useNavigate();
  const [term, setTerm] = useState(initialTerm);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = useSearchSuggestions(term);
  const { categories } = useTaxonomy();
  const recent = useRecentSearches();

  const open = variant === "overlay" || focused;
  useOutsideClick([rootRef], () => setFocused(false), variant === "inline" && focused);

  // ── Build one flat option list (keyboard order = visual order) ────────────────────────
  const groups = [];
  const trimmed = term.trim();
  if (!suggestions.active) {
    if (recent.terms.length) {
      groups.push({
        key: "recent",
        label: "Recent searches",
        action: { label: "Clear", onClick: recent.clear },
        options: recent.terms.map((t) => ({
          kind: "recent",
          label: t,
          href: `/shop?q=${encodeURIComponent(t)}`,
          term: t,
        })),
      });
    }
    if (categories.length) {
      groups.push({
        key: "popular",
        label: "Popular categories",
        options: categories.map((c) => ({
          kind: "link",
          label: c.name,
          href: `/category/${c.slug}`,
        })),
      });
    }
  } else {
    // "Search all" first: always available, and loading/empty messages then sit below it,
    // where the product results will appear.
    groups.push({
      key: "all",
      label: null,
      options: [
        {
          kind: "search",
          label: `Search all products for “${trimmed}”`,
          href: `/shop?q=${encodeURIComponent(trimmed)}`,
          term: trimmed,
        },
      ],
    });
    if (suggestions.categories.length) {
      groups.push({
        key: "categories",
        label: "Categories",
        options: suggestions.categories.map((c) => ({
          kind: "link",
          label: c.name,
          href: `/category/${c.slug}`,
        })),
      });
    }
    if (suggestions.brands.length) {
      groups.push({
        key: "brands",
        label: "Brands",
        options: suggestions.brands.map((b) => ({
          kind: "link",
          label: b.name,
          href: `/brand/${b.slug}`,
        })),
      });
    }
    const items = suggestions.products.data?.items ?? [];
    if (items.length) {
      groups.push({
        key: "products",
        label: "Products",
        options: items.map((card) => ({
          kind: "product",
          label: card.name,
          href: card.href,
          card,
          term: trimmed,
        })),
      });
    }
  }
  const options = groups.flatMap((g) => g.options);
  const optionId = (i) => `${id}-opt-${i}`;

  const close = () => {
    setFocused(false);
    setActive(-1);
    inputRef.current?.blur();
    onDone?.();
  };

  const choose = (option) => {
    if (option.term) recent.add(option.term);
    navigate(option.href);
    if (option.kind === "search" || option.kind === "recent") setTerm(option.term);
    close();
  };

  const submit = (event) => {
    event.preventDefault();
    if (active >= 0 && options[active]) return choose(options[active]);
    if (trimmed.length < 1) return undefined;
    return choose({
      kind: "search",
      term: trimmed,
      href: `/shop?q=${encodeURIComponent(trimmed)}`,
    });
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocused(true);
      setActive((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1));
    } else if (event.key === "Escape") {
      if (term && variant === "overlay") setTerm("");
      else close();
    }
  };

  const loadingProducts =
    suggestions.active && (suggestions.settling || suggestions.products.isFetching);
  const noProducts =
    suggestions.active &&
    !loadingProducts &&
    suggestions.products.isSuccess &&
    suggestions.products.data.items.length === 0;

  const showPanel =
    open && (options.length > 0 || loadingProducts || noProducts || suggestions.products.isError);

  let index = -1;

  return (
    <div ref={rootRef} className={cn("relative", variant === "overlay" && "flex h-full flex-col")}>
      <form role="search" onSubmit={submit} className="relative">
        <label htmlFor={`${id}-input`} className="sr-only">
          Search products, brands and categories
        </label>
        <Search
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 z-10 size-5 -translate-y-1/2 text-ink-3",
            variant === "inline" ? "left-3.5" : "left-3",
          )}
        />
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          enterKeyHint="search"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- only when the user just opened search (overlay, or focused the header field)
          autoFocus={focusOnMount}
          placeholder="Search whey, creatine, brands…"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setActive(-1);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          className={cn(
            variant === "inline"
              ? "h-12 w-full rounded-lg bg-night-2 pr-10 pl-11 text-body text-night-text ring-1 ring-night-line transition-colors duration-(--duration-fast) outline-none placeholder:text-night-muted hover:ring-night-muted focus:bg-surface focus:text-ink focus:ring-2 focus:ring-brand focus:placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
              : "h-12 w-full rounded-md border border-line-strong bg-surface pr-10 pl-10 text-body outline-none placeholder:text-ink-3 focus-visible:border-ink [&::-webkit-search-cancel-button]:hidden",
          )}
        />
        {term && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setTerm("");
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-ink-2 hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </form>

      {showPanel && (
        <div
          className={cn(
            variant === "inline"
              ? "absolute top-full right-0 left-0 z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-card border border-line bg-surface p-2 text-ink shadow-overlay lg:-right-24"
              : "mt-3 flex-1 overflow-y-auto overscroll-contain pb-6",
          )}
        >
          <ul id={listId} role="listbox" aria-label="Search suggestions" className="flex flex-col">
            {groups.map((group) => (
              <li key={group.key} role="presentation" className="py-1">
                {group.label && (
                  <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
                    <span className="label-caps text-ink-3">{group.label}</span>
                    {group.action && (
                      <button
                        type="button"
                        onClick={group.action.onClick}
                        className="text-small text-ink-2 underline-offset-2 hover:underline"
                      >
                        {group.action.label}
                      </button>
                    )}
                  </div>
                )}
                <ul role="group" aria-label={group.label ?? undefined}>
                  {group.options.map((option) => {
                    index += 1;
                    const i = index;
                    return (
                      // Keyboard is handled on the input (aria-activedescendant), the ARIA combobox pattern.
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                      <li
                        key={`${option.kind}-${option.href}`}
                        id={optionId(i)}
                        role="option"
                        aria-selected={active === i}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => choose(option)}
                        onPointerMove={() => active !== i && setActive(i)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2",
                          active === i ? "bg-shelf" : "hover:bg-shelf/60",
                        )}
                      >
                        <OptionContent option={option} />
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>

          {loadingProducts && (
            <p role="status" className="flex items-center gap-2 px-2 py-2 text-small text-ink-3">
              <Spinner className="size-3.5" /> Searching products…
            </p>
          )}
          {noProducts && (
            <p className="px-2 py-2 text-small text-ink-2">
              No products match “{trimmed}”. Try a brand name or a shorter word.
            </p>
          )}
          {suggestions.products.isError && (
            <p className="px-2 py-2 text-small text-danger">
              Couldn't load suggestions. Press Enter to search anyway.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OptionContent({ option }) {
  if (option.kind === "product") {
    const { card } = option;
    return (
      <>
        <span className="size-12 shrink-0 bg-shelf p-1">
          <CloudImage src={card.image?.url} alt="" ratio="square" sizes="48px" trim blend />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate label-caps text-ink-3">{card.brand}</span>
          <span className="line-clamp-2 text-small font-medium md:line-clamp-1">{card.name}</span>
          {/* Phones: price under the name so the name gets the full width. */}
          <Price
            price={card.price}
            salePrice={card.salePrice}
            from={card.priceFrom}
            size="sm"
            className="mt-0.5 md:hidden"
          />
        </span>
        <Price
          price={card.price}
          salePrice={card.salePrice}
          from={card.priceFrom}
          size="sm"
          className="hidden shrink-0 justify-end md:flex"
        />
      </>
    );
  }
  if (option.kind === "recent") {
    return (
      <>
        <Clock aria-hidden="true" className="size-4 shrink-0 text-ink-3" />
        <span className="flex-1 truncate">{option.label}</span>
      </>
    );
  }
  if (option.kind === "search") {
    return (
      <>
        <Search aria-hidden="true" className="size-4 shrink-0 text-ink-2" />
        <span className="flex-1 truncate font-semibold">{option.label}</span>
      </>
    );
  }
  return (
    <>
      <span className="flex-1 truncate">{option.label}</span>
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-ink-3" />
    </>
  );
}
