import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "../../lib/cn";

/** Page title row: title, short help line, actions on the right. */
export function AdminHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <title>{`${title} | Admin`}</title>
        <h1 className="text-h2 font-extrabold uppercase font-condensed md:text-h1">{title}</h1>
        {description && <p className="mt-1 max-w-[70ch] text-small text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className }) {
  return (
    <section className={cn("rounded-sm border border-line bg-surface", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Horizontally scrollable table (phones scroll sideways rather than squash columns). */
export function Table({ children, label, className }) {
  return (
    <div className={cn("overflow-x-auto rounded-sm border border-line bg-surface", className)}>
      <table aria-label={label} className="w-full min-w-[640px] border-collapse text-small">
        {children}
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-ink-3">
        {children}
      </td>
    </tr>
  );
}

/** Prev / page x of y / next. */
export function Pagination({ page, pages, onPage, total, label = "items" }) {
  if (!pages || pages <= 1) {
    return total != null ? (
      <p className="mt-3 text-small text-ink-3">
        {total} {label}
      </p>
    ) : null;
  }
  const btn =
    "flex size-9 items-center justify-center rounded-sm border border-line-strong bg-surface hover:border-ink disabled:opacity-40 disabled:hover:border-line-strong";
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-4 text-small">
      <span className="text-ink-3">
        {total != null && `${total} ${label} · `}Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </nav>
  );
}

/** Small on/off switch for booleans (featured, active). */
export function Toggle({ checked, onChange, label, disabled, hideLabel = false }) {
  return (
    <label
      className={cn("inline-flex cursor-pointer items-center gap-2.5", disabled && "opacity-50")}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-10 rounded-full bg-line-strong transition-colors duration-(--duration-fast) peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-surface after:transition-transform after:duration-(--duration-fast) peer-checked:after:translate-x-4"
      />
      <span className={cn("text-small", hideLabel && "sr-only")}>{label}</span>
    </label>
  );
}
