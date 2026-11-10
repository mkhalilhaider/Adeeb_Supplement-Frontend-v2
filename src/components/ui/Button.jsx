import { Link } from "react-router";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold " +
  "transition-[background-color,color,border-color,opacity] duration-(--duration-fast) ease-(--ease-out-soft) " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

/**
 * primary   — the one main action on a screen (orange with ink text: AA contrast)
 * secondary — strong but not the main action (ink)
 * outline   — quiet alternative
 * ghost     — toolbar / inline actions
 * link      — text action that looks like a link
 * danger    — destructive confirmations only
 */
const variants = {
  primary: "bg-brand text-ink hover:bg-brand-hover",
  secondary: "bg-ink text-paper hover:bg-ink-2",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:bg-shelf",
  link: "text-ink underline decoration-1 underline-offset-4 hover:text-brand-ink",
  danger: "bg-danger text-white hover:opacity-90",
};

/** Heights: 36 / 44 / 48px. Touch targets stay ≥ 44px except `sm` (dense desktop UI). */
const sizes = {
  sm: "h-9 rounded-md px-3 text-small",
  md: "h-11 rounded-md px-5 text-body",
  lg: "h-12 rounded-md px-6 text-body",
};

/**
 * One button for every action. Renders a <Link> when `to` is given, an <a> for `href`,
 * otherwise a <button type="button"> (pass type="submit" for forms).
 *
 * @param {object} props
 * @param {keyof typeof variants} [props.variant]
 * @param {keyof typeof sizes} [props.size]
 * @param {boolean} [props.loading]   Shows a spinner, keeps width, blocks clicks
 * @param {boolean} [props.fullWidth]
 * @param {string} [props.to]         Internal route
 * @param {string} [props.href]       External link
 * @param {import("react").ReactNode} [props.leadingIcon]
 * @param {import("react").ReactNode} [props.trailingIcon]
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  to,
  href,
  leadingIcon,
  trailingIcon,
  className,
  children,
  disabled,
  type = "button",
  ref,
  ...rest
}) {
  const classes = cn(
    base,
    variants[variant],
    variant !== "link" && sizes[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {leadingIcon}
        {children}
        {trailingIcon}
      </span>
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} aria-disabled={disabled || undefined} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} aria-disabled={disabled || undefined} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}

const iconSizes = { sm: "size-9", md: "size-11", lg: "size-12" };
const iconVariants = {
  ghost: "text-ink hover:bg-shelf",
  outline: "border border-line-strong text-ink hover:border-ink",
  solid: "bg-ink text-paper hover:bg-ink-2",
};

/**
 * Square icon-only button. `label` is required: it becomes the accessible name.
 * @param {{ label: string, size?: keyof typeof iconSizes, variant?: keyof typeof iconVariants }} props
 */
export function IconButton({
  label,
  size = "md",
  variant = "ghost",
  className,
  children,
  type = "button",
  ref,
  ...rest
}) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-(--duration-fast)",
        "disabled:pointer-events-none disabled:opacity-50",
        iconSizes[size],
        iconVariants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
