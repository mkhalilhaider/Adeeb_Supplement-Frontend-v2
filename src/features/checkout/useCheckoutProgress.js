import { useEffect, useRef } from "react";
import { useDebouncedValue } from "../../lib/hooks";
import { saveCheckoutProgress } from "./api";
import { buildProgressBody, hasContact } from "./lib/checkout-body";

/**
 * Save checkout progress for abandoned-checkout follow-ups: debounced (one request after the
 * shopper pauses), skipped when nothing changed, and only once there is someone to contact.
 * Failures are ignored — this must never get in the way of placing the order.
 */
export function useCheckoutProgress({ values, lines, loggedIn, sessionKey, enabled = true }) {
  const payload =
    enabled && lines.length > 0 && hasContact(values, loggedIn)
      ? JSON.stringify(buildProgressBody({ values, lines, loggedIn }))
      : "";
  const settled = useDebouncedValue(payload, 2000);
  const lastSent = useRef("");

  useEffect(() => {
    if (!settled || settled === lastSent.current) return;
    lastSent.current = settled;
    saveCheckoutProgress(sessionKey, JSON.parse(settled)).catch(() => {});
  }, [settled, sessionKey]);
}
