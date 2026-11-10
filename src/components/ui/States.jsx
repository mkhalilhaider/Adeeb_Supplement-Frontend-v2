import { CloudOff, RotateCw, SearchX, ShieldAlert } from "lucide-react";
import { ApiError, errorMessage } from "../../lib/api/errors";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

/**
 * Empty result (no products, empty cart, no orders). Always offer a next step.
 * @param {{ icon?: import("react").ComponentType, title: string, description?: string, action?: import("react").ReactNode }} props
 */
export function EmptyState({ icon: Icon = SearchX, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-12 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-shelf text-ink-2">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-h3 font-semibold">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-ink-2">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/**
 * Failed load with a retry. Picks wording from the error type (offline, timeout, not allowed…).
 * `compact` fits inside a section (e.g. a reviews block) instead of a full page.
 *
 * @param {{ error: unknown, onRetry?: () => void, retrying?: boolean, title?: string, compact?: boolean }} props
 */
export function ErrorState({
  error,
  onRetry,
  retrying = false,
  title,
  compact = false,
  className,
}) {
  const offline = error instanceof ApiError && (error.isNetwork || error.isTimeout);
  const forbidden = error instanceof ApiError && (error.isForbidden || error.isUnauthorized);
  const Icon = offline ? CloudOff : forbidden ? ShieldAlert : RotateCw;
  const heading =
    title ??
    (offline ? "You seem to be offline" : forbidden ? "Not available" : "Couldn't load this");

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "rounded-md border border-line px-4 py-6" : "px-4 py-12",
        className,
      )}
    >
      {!compact && (
        <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      )}
      <h2 className={cn("font-semibold", compact ? "text-body" : "mt-4 text-h3")}>{heading}</h2>
      <p className="mt-1 max-w-sm text-small text-ink-2">{errorMessage(error)}</p>
      {onRetry && !forbidden && (
        <Button
          variant="outline"
          size={compact ? "sm" : "md"}
          className="mt-4"
          onClick={onRetry}
          loading={retrying}
          leadingIcon={<RotateCw aria-hidden="true" className="size-4" />}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
