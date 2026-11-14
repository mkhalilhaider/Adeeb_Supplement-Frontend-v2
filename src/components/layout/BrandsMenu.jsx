import { lazy, Suspense, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { useOutsideClick, useRouteScopedToggle } from "../../lib/hooks";

const loadPanel = () => import("./BrandsMenuPanel");
const BrandsMenuPanel = lazy(loadPanel);

const OPEN_DELAY = 140;
const CLOSE_DELAY = 220;

/**
 * Desktop "Brands" mega-menu: logo grid of every brand we stock. Opens on hover like "Shop all"
 * (after a short delay, so passing over it doesn't flash it open), and on click for keyboard
 * and touch-screen laptops; closes on Esc, outside click, pointer leave or navigation. The
 * panel's code loads on first intent and reuses the cached brand list (no API request).
 */
export function BrandsMenu() {
  const { open, setOpen, toggle } = useRouteScopedToggle();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const timer = useRef(0);
  useOutsideClick([rootRef], () => setOpen(false), open);

  const later = (next, delay) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    // Hover intent and Escape only; the button below is the real (keyboard and touch) control.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={rootRef}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        loadPanel();
        later(true, OPEN_DELAY);
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && later(false, CLOSE_DELAY)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="brands-menu"
        onFocus={loadPanel}
        onClick={() => {
          window.clearTimeout(timer.current);
          toggle();
        }}
        className={cn(
          "flex h-12 items-center gap-1 border-b-2 text-small font-semibold transition-colors",
          open
            ? "border-brand text-white"
            : "border-transparent text-night-muted hover:border-brand hover:text-white",
        )}
      >
        Brands
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
          <BrandsMenuPanel id="brands-menu" />
        </Suspense>
      )}
    </div>
  );
}
