import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Trail of links; the last item is the current page. On phones only the parent is shown
 * ("‹ Protein") to save space; the full trail appears from tablet up.
 *
 * @param {{ items: { label: string, to?: string }[] }} props
 */
export function Breadcrumbs({ items, className }) {
  if (!items?.length) return null;
  const parent = [...items].reverse().find((item, i) => i > 0 && item.to);

  return (
    <nav aria-label="Breadcrumb" className={cn("text-small", className)}>
      {parent && (
        <Link
          to={parent.to}
          className="inline-flex items-center gap-1 text-ink-2 hover:text-ink md:hidden"
        >
          <ChevronRight aria-hidden="true" className="size-4 rotate-180" />
          {parent.label}
        </Link>
      )}
      <ol className="hidden flex-wrap items-center gap-1 text-ink-3 md:flex">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {last || !item.to ? (
                <span aria-current={last ? "page" : undefined} className={last ? "text-ink" : ""}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-ink hover:underline">
                  {item.label}
                </Link>
              )}
              {!last && <ChevronRight aria-hidden="true" className="size-3.5" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
