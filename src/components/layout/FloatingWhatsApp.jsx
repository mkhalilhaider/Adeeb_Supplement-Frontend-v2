import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { whatsappLink } from "../../config/site";
import { getData } from "../../lib/api";
import { cn } from "../../lib/cn";
import { BrandIcon } from "../ui/BrandIcons";
import { WHATSAPP_DEFAULTS } from "./whatsapp-defaults";

const SEEN_KEY = "adeeb.wa-greeting";

const seenThisVisit = () => {
  try {
    return Boolean(sessionStorage.getItem(SEEN_KEY));
  } catch {
    return false;
  }
};

/**
 * The greeting bubble beside the button (also the live preview in Admin → WhatsApp button).
 * @param {{ settings: typeof WHATSAPP_DEFAULTS, href: string, onClose?: () => void,
 *   onOpen?: () => void, leaving?: boolean }} props
 */
export function WhatsAppGreeting({ settings, href, onClose, onOpen, leaving = false }) {
  return (
    <div
      role="status"
      className={cn(
        "relative mb-1 w-[min(15.5rem,calc(100vw-6.5rem))] rounded-2xl rounded-br-md bg-surface p-3.5 pr-9 text-ink shadow-[0_18px_40px_-14px_rgb(0_0_0/0.45)] ring-1 ring-line",
        leaving
          ? "motion-safe:animate-[promo-pop-out_300ms_ease-in_forwards]"
          : "motion-safe:animate-[promo-pop-in_450ms_var(--ease-out-soft)_both]",
      )}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close message"
          className="absolute top-1 right-1 flex size-[34px] items-center justify-center rounded-full text-ink-3 hover:bg-shelf hover:text-ink"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onOpen} className="block">
        {settings.greetingTitle && (
          <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
            <span aria-hidden="true" className="size-2 rounded-full bg-[#25d366]" />
            {settings.greetingTitle}
          </span>
        )}
        <span className="mt-1 block text-small leading-snug text-ink-2">
          {settings.greetingText}{" "}
          {settings.linkText && (
            <span className="font-bold text-ink underline underline-offset-2">
              {settings.linkText}
            </span>
          )}
        </span>
      </a>
    </div>
  );
}

/**
 * Floating "Chat on WhatsApp" button, bottom-right on every store page: a black tile with the
 * WhatsApp logo and a green "online" dot. A greeting pops out beside it after a few seconds (with
 * a soft green pulse), then tucks itself away. Text, timing, how often and where are set in
 * Admin → WhatsApp button. On phones it sits above the bottom tab bar, and moves up while a
 * product page's sticky buy bar is showing (see `.wa-float` in index.css). Checkout and admin
 * use their own layouts, so it never covers those.
 */
export default function FloatingWhatsApp() {
  const { pathname } = useLocation();
  const { data } = useQuery({
    queryKey: ["whatsapp-widget"],
    queryFn: ({ signal }) => getData("/whatsapp-widget", { signal }),
    staleTime: 5 * 60_000,
    meta: { persist: true },
  });
  const settings = { ...WHATSAPP_DEFAULTS, ...data };
  // "shown" → "leaving" (exit animation) → "gone". Never comes back during this page load.
  const [phase, setPhase] = useState(/** @type {"waiting"|"shown"|"leaving"|"gone"} */ ("waiting"));
  const [hovered, setHovered] = useState(false);
  const href = whatsappLink(settings.chatMessage);

  const wanted =
    settings.greetingEnabled &&
    Boolean(settings.greetingText) &&
    !(settings.pages === "home" && pathname !== "/") &&
    !(settings.frequency === "once_per_visit" && seenThisVisit());

  // Greet a few seconds after arriving (once per page load; "once per visit" if set so).
  useEffect(() => {
    if (!wanted || phase !== "waiting") return undefined;
    const timer = window.setTimeout(() => {
      setPhase("shown");
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* private mode: "once per visit" may greet again */
      }
    }, settings.delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [wanted, phase, settings.delaySeconds]);

  const hide = () => setPhase((p) => (p === "shown" ? "leaving" : p));

  // Tuck it away after the set time (not while the pointer is on it); 0 = until closed.
  useEffect(() => {
    if (phase !== "shown" || hovered || !settings.hideSeconds) return undefined;
    const timer = window.setTimeout(hide, settings.hideSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [phase, hovered, settings.hideSeconds]);

  // Let the exit animation finish, then remove it.
  useEffect(() => {
    if (phase !== "leaving") return undefined;
    const timer = window.setTimeout(() => setPhase("gone"), 300);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (!settings.enabled) return null;
  const greeting = phase === "shown" || phase === "leaving";

  return (
    <div
      className="wa-float fixed right-4 z-30 flex items-end gap-3 md:right-6 print:hidden"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {greeting && (
        <WhatsAppGreeting
          settings={settings}
          href={href}
          leaving={phase === "leaving"}
          onClose={hide}
          onOpen={hide}
        />
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        onClick={hide}
        className="relative flex size-[54px] flex-none items-center justify-center rounded-2xl bg-ink text-white shadow-[0_14px_30px_-12px_rgb(0_0_0/0.55)] ring-1 ring-white/20 transition-[translate,box-shadow,scale] duration-(--duration-base) ease-(--ease-out-soft) hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-12px_rgb(0_0_0/0.6)] active:scale-95 motion-safe:animate-[fade-up_500ms_var(--ease-out-soft)_both]"
      >
        {phase === "shown" && (
          // Soft green pulse while the greeting is up, so the eye finds the button.
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-[#25d366] motion-safe:animate-[wa-pulse_1.6s_ease-out_3]"
          />
        )}
        <BrandIcon name="WhatsApp" className="size-[26px]" />
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 size-2.5 rounded-full bg-[#25d366] ring-2 ring-ink"
        />
      </a>
    </div>
  );
}
