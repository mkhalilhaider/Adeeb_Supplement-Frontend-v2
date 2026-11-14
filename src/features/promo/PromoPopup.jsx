import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import * as RadixDialog from "@radix-ui/react-dialog";
import { getData } from "../../lib/api";
import { useSession } from "../auth/session-store";
import { PromoCard } from "./PromoCard";

const STORE_KEY = "adeeb.promo";
const SESSION_KEY = "adeeb.promo-shown";
const DAY = 86_400_000;

const readClosed = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
};
const shownThisVisit = () => {
  try {
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
};

/**
 * Whether this visitor should see the popup now. `repeatDays` 0 = every time the site is
 * opened or refreshed (once per page load, never again while browsing). Otherwise: once per
 * visit, a new or edited popup always shows, and after closing it waits `repeatDays`.
 */
function isDue(popup) {
  if (popup.repeatDays === 0) return true;
  if (shownThisVisit()) return false;
  const closed = readClosed();
  if (closed.version !== popup.version || !closed.at) return true;
  return Date.now() - closed.at >= popup.repeatDays * DAY;
}

/** Account and order pages are for getting things done — no promos there. */
const QUIET_PATHS = [
  "/account",
  "/order/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Storefront promo popup from Admin → Promo popup. Appears after the set delay, respects
 * "guests only", "homepage only" and "show again after N days", and closes itself after the
 * "stays open" time when one is set (a thin bar shows the time left). `?promo-preview=1` on any
 * store page shows the saved popup straight away (for checking it from the admin page).
 */
export default function PromoPopup() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const status = useSession((s) => s.status);
  const preview = new URLSearchParams(search).has("promo-preview");
  const { data: popup } = useQuery({
    queryKey: ["promo-popup"],
    queryFn: ({ signal }) => getData("/promo-popup", { signal }),
    staleTime: 5 * 60_000,
  });
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(/** @type {number|null} */ (null));

  const eligible =
    Boolean(popup) &&
    !done &&
    (preview ||
      (status !== "unknown" &&
        !(popup.audience === "guests" && status === "authenticated") &&
        !(popup.pages === "home" && pathname !== "/") &&
        !QUIET_PATHS.some((p) => pathname.startsWith(p)) &&
        isDue(popup)));

  // Appear after the delay (the timer survives page changes: this lives in the store layout).
  useEffect(() => {
    if (!eligible || open) return undefined;
    const timer = window.setTimeout(
      () => {
        setOpen(true);
        setProgress(1);
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* private mode: it may show again this visit */
        }
      },
      preview ? 300 : popup.delaySeconds * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [eligible, open, preview, popup]);

  const close = () => {
    setOpen(false);
    setDone(true);
    if (preview) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ version: popup.version, at: Date.now() }));
    } catch {
      /* storage blocked: it may show again next visit */
    }
  };

  // Close by itself after the "stays open" time, with a bar showing the time left.
  useEffect(() => {
    if (!open || !popup?.staySeconds) return undefined;
    const start = Date.now();
    const total = popup.staySeconds * 1000;
    const tick = window.setInterval(() => {
      const left = 1 - (Date.now() - start) / total;
      if (left <= 0) {
        window.clearInterval(tick);
        close();
      } else setProgress(left);
    }, 100);
    return () => window.clearInterval(tick);
    // close() only reads popup, which is in the deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, popup]);

  const act = () => {
    close();
    const target =
      popup.ctaTarget === "register"
        ? "/register"
        : popup.ctaTarget === "shop"
          ? "/shop"
          : popup.ctaUrl;
    if (!target) return;
    if (target.startsWith("/")) navigate(target);
    else window.open(target, "_blank", "noopener,noreferrer");
  };

  if (!popup) return null;
  const narrow = popup.layout !== "image_text" || !popup.image?.url;

  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && close()}>
      <RadixDialog.Portal>
        {/* Eases in and out (see the promo-* keyframes): a slow fade for the backdrop, the card
            rises softly into place and sinks away when closed. */}
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/55 data-[state=closed]:animate-[promo-fade-out_320ms_ease-in_forwards] data-[state=open]:animate-[promo-fade-in_420ms_ease-out]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className={
            "fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-[18px] shadow-overlay outline-none " +
            "data-[state=closed]:animate-[promo-sheet-out_320ms_ease-in_forwards] data-[state=open]:animate-[promo-sheet-in_520ms_var(--ease-out-soft)] " +
            "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-band " +
            "md:data-[state=closed]:animate-[promo-pop-out_300ms_ease-in_forwards] md:data-[state=open]:animate-[promo-pop-in_520ms_var(--ease-out-soft)] " +
            (narrow ? "md:w-[min(440px,calc(100vw-48px))]" : "md:w-[min(680px,calc(100vw-48px))]")
          }
        >
          {popup.layout === "image" && (
            <RadixDialog.Title className="sr-only">
              {popup.title || "Special offer"}
            </RadixDialog.Title>
          )}
          <PromoCard
            popup={popup}
            onAction={act}
            onClose={close}
            progress={popup.staySeconds ? progress : null}
            TitleTag={popup.layout === "image" ? "p" : RadixDialog.Title}
          />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
