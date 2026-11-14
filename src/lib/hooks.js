import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/** `value`, but only after it has stopped changing for `delay` ms (search-as-you-type). */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Open/close state that resets itself whenever the route changes (menus, overlays), without
 * an effect: the state remembers which location it was opened on.
 */
export function useRouteScopedToggle() {
  const location = useLocation();
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === location.key;
  return {
    open,
    setOpen: (next) => setOpenOn(next ? location.key : null),
    toggle: () => setOpenOn(open ? null : location.key),
  };
}

/** Call `handler` for pointer-downs outside every element in `refs` while `active`. */
export function useOutsideClick(refs, handler, active = true) {
  // Latest refs/handler without re-subscribing on every render.
  const latest = useRef({ refs, handler });
  useEffect(() => {
    latest.current = { refs, handler };
  });
  useEffect(() => {
    if (!active) return undefined;
    const onDown = (event) => {
      const { refs: current, handler: fn } = latest.current;
      if (current.every((ref) => !ref.current?.contains(event.target))) fn(event);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [active]);
}

/**
 * True once the element has come within `rootMargin` of the viewport (then stays true).
 * Used to load below-the-fold sections only when they're about to be seen.
 *
 * The returned ref is a callback ref, so it also works when the element only appears after a
 * later render (e.g. a section that renders nothing until its data arrives).
 */
export function useInViewOnce({ rootMargin = "400px 0px" } = {}) {
  const [node, setNode] = useState(/** @type {Element|null} */ (null));
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, seen, rootMargin]);
  return [setNode, seen];
}

/**
 * Return focus to whatever opened an overlay, for Radix/Vaul content whose open state we
 * control ourselves (their built-in restore only works with their own Trigger).
 * Spread the result onto the Content: <Content {...useReturnFocus()} />.
 */
export function useReturnFocus() {
  const openerRef = useRef(null);
  return {
    onOpenAutoFocus: () => {
      const el = document.activeElement;
      openerRef.current = el instanceof HTMLElement && el !== document.body ? el : null;
    },
    onCloseAutoFocus: (event) => {
      const opener = openerRef.current;
      if (opener?.isConnected) {
        event.preventDefault();
        opener.focus({ preventScroll: true });
      }
    },
  };
}
