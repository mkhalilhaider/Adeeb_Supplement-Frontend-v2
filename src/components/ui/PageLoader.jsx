/**
 * Quiet full-area loading state for route transitions and guards. Appears only after a short
 * delay (CSS), so fast loads never flash a spinner.
 */
export function PageLoader({ label = "Loading", className = "" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-[50vh] items-center justify-center ${className}`}
    >
      <span className="flex animate-fade-in-delayed items-center gap-3 text-ink-3">
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-ink"
        />
        <span className="label-mono">{label}</span>
      </span>
    </div>
  );
}
