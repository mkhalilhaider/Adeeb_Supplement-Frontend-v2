import { lazy, Suspense, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { useOutsideClick, useRouteScopedToggle } from "../../lib/hooks";

const loadPanel = () => import("./ShopMenuPanel");
const ShopMenuPanel = lazy(loadPanel);

const OPEN_DELAY = 140;
const CLOSE_DELAY = 220;

/**
 * "Shop all" mega menu in the category row. Opens on hover (after a short delay, so passing
 * over it doesn't flash it open), on click or with Enter/Space; Escape closes and returns focus.
 * The panel's code loads on first intent and reuses the cached taxonomy, so opening it makes no
 * API request.
 */
export function ShopMenu() {
  const { open, setOpen, toggle } = useRouteScopedToggle();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const timer = useRef(0);
  useOutsideClick([rootRef], () => setOpen(false), open);

  const later = (next, delay) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  };

  return (
    // Hover intent and Escape only; the button below is the real (keyboard and touch) control.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={rootRef}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        loadPanel();
        later(true, OPEN_DELAY);
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && later(false, CLOSE_DELAY)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="shop-menu"
        onFocus={loadPanel}
        onClick={() => {
          window.clearTimeout(timer.current);
          toggle();
        }}
        className={cn(
          "flex h-12 items-center gap-1 border-b-2 text-small font-semibold transition-colors duration-(--duration-fast)",
          open
            ? "border-brand text-white"
            : "border-transparent text-night-text hover:border-brand hover:text-white",
        )}
      >
        Shop all
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 transition-transform duration-(--duration-base)",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <Suspense fallback={null}>
          <ShopMenuPanel id="shop-menu" onNavigate={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
