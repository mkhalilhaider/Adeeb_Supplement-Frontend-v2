import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/cn";

/** Shared look for text-like controls: 48px tall, 4px radius, ink focus, red when invalid. */
export const controlClasses =
  "w-full rounded-sm border border-line-strong bg-surface text-ink placeholder:text-ink-3 " +
  "transition-colors duration-(--duration-fast) outline-none " +
  "hover:border-ink-3 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink " +
  "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger " +
  "disabled:cursor-not-allowed disabled:bg-shelf disabled:text-ink-3";

/**
 * Text input. `leading`/`trailing` render inside the box (icons, "+92", unit labels).
 * Spread useForm's field() result straight onto it.
 */
export function Input({ leading, trailing, className, ref, ...props }) {
  if (!leading && !trailing) {
    return <input ref={ref} className={cn(controlClasses, "h-12 px-3", className)} {...props} />;
  }
  return (
    <div className={cn("relative flex items-center", className)}>
      {leading && (
        <span className="pointer-events-none absolute left-3 flex items-center text-ink-3">
          {leading}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          controlClasses,
          "h-12",
          leading ? "pl-10" : "pl-3",
          trailing ? "pr-12" : "pr-3",
        )}
        {...props}
      />
      {trailing && <span className="absolute right-2 flex items-center">{trailing}</span>}
    </div>
  );
}

export function Textarea({ className, rows = 4, ref, ...props }) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlClasses, "min-h-24 resize-y px-3 py-2.5 leading-normal", className)}
      {...props}
    />
  );
}

/** Native <select> (best on mobile: uses the OS picker) with a custom chevron. */
export function Select({ className, children, ref, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        className={cn(controlClasses, "h-12 appearance-none pr-10 pl-3")}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-2"
      />
    </div>
  );
}

/** Native checkbox, custom-drawn. Label is part of the control (larger touch target). */
export function Checkbox({ label, description, className, id, ref, ...props }) {
  return (
    <label
      htmlFor={id}
      className={cn("group flex cursor-pointer items-start gap-3 py-1", className)}
    >
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-xs border border-line-strong bg-surface transition-colors checked:border-ink checked:bg-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className="pointer-events-none absolute size-3.5 text-paper opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="flex flex-col">
        <span className="text-body leading-snug text-ink">{label}</span>
        {description && <span className="text-small text-ink-3">{description}</span>}
      </span>
    </label>
  );
}
