import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVITY = ["pointerdown", "keydown", "wheel", "touchstart"];

/**
 * Sign the admin out after `idleMs` without activity, warning `warnMs` before. Activity is
 * pointer, keyboard, wheel and touch input (not mere mouse movement, which a forgotten
 * window can still receive).
 *
 * @returns {{ warning: boolean, secondsLeft: number, stay: () => void }}
 */
export function useIdleLogout({ idleMs = 30 * 60_000, warnMs = 60_000, onTimeout }) {
  const [deadline, setDeadline] = useState(() => Date.now() + idleMs);
  const [now, setNow] = useState(() => Date.now());
  const last = useRef(0);
  const timeoutRef = useRef(onTimeout);

  useEffect(() => {
    timeoutRef.current = onTimeout;
  }, [onTimeout]);

  const stay = useCallback(() => setDeadline(Date.now() + idleMs), [idleMs]);

  // Reset the clock on activity (at most once every 5 seconds).
  useEffect(() => {
    const onActivity = () => {
      const t = Date.now();
      if (t - last.current < 5000) return;
      last.current = t;
      setDeadline(t + idleMs);
    };
    ACTIVITY.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => ACTIVITY.forEach((e) => window.removeEventListener(e, onActivity));
  }, [idleMs]);

  // A one-second tick only matters during the warning; a coarse one is enough otherwise.
  const warning = deadline - now <= warnMs;
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), warning ? 1000 : 15_000);
    return () => clearInterval(id);
  }, [warning]);

  // Laptop lid closed for an hour: check as soon as the tab is visible again.
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (now >= deadline) timeoutRef.current?.();
  }, [now, deadline]);

  return { warning, secondsLeft: Math.max(0, Math.ceil((deadline - now) / 1000)), stay };
}
