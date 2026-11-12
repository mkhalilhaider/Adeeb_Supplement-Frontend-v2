import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";

const loadCombobox = () => import("../../features/search/SearchCombobox");
const SearchCombobox = lazy(() => loadCombobox().then((m) => ({ default: m.SearchCombobox })));

/**
 * Desktop header search. Until the shopper points at or focuses it, this is a plain search
 * form (submitting still works); the suggestions combobox — the heaviest part of the header —
 * loads on first hover or focus and takes over with whatever was typed.
 */
export function InlineSearch() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");

  const plain = (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        const q = draft.trim();
        navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
      }}
    >
      <label htmlFor="header-search" className="sr-only">
        Search products, brands and categories
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-5 -translate-y-1/2 text-ink-3"
      />
      <input
        id="header-search"
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Search whey, creatine, brands…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setReady(true)}
        className="h-12 w-full rounded-lg bg-night-2 pr-10 pl-11 text-body text-night-text ring-1 ring-night-line transition-colors duration-(--duration-fast) outline-none placeholder:text-night-muted hover:ring-night-muted focus:bg-surface focus:text-ink focus:ring-2 focus:ring-brand focus:placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
      />
    </form>
  );

  if (!ready) {
    return (
      <div onPointerEnter={() => loadCombobox()} onTouchStart={() => loadCombobox()}>
        {plain}
      </div>
    );
  }
  return (
    <Suspense fallback={plain}>
      <SearchCombobox variant="inline" focusOnMount initialTerm={draft} />
    </Suspense>
  );
}
