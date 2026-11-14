import { env } from "../config/env";

/**
 * Google Analytics 4 (VITE_GA_ID) and Meta Pixel (VITE_META_PIXEL_ID), both optional.
 * Scripts load only after the first interaction or 9 s (never delaying the store), never on admin pages,
 * and events sent before that are queued by the standard snippets.
 */

let started = false;
const enabled = () => Boolean(env.gaId || env.metaPixelId);
const isAdminPath = () => window.location.pathname.startsWith("/admin");

function addScript(src) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function start() {
  if (started || !enabled() || isAdminPath()) return;
  started = true;

  if (env.gaId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag.js reads the `arguments` object, not an array.
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    // Page views are sent by the router listener below (single-page app).
    window.gtag("config", env.gaId, { send_page_view: false });
  }

  if (env.metaPixelId && !window.fbq) {
    const fbq = function fbq(...args) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
    window.fbq("init", env.metaPixelId);
  }

  const load = () => {
    if (env.gaId)
      addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(env.gaId)}`);
    if (env.metaPixelId) addScript("https://connect.facebook.net/en_US/fbevents.js");
  };
  // Third-party scripts are heavy (~380 KB, ~2 s of main-thread work on a phone), so they wait
  // for the visitor's first scroll, tap, click or key press, or 9 seconds — whichever comes
  // first — and never compete with the page loading. Calls made before then are queued.
  const events = ["pointerdown", "keydown", "scroll", "touchstart"];
  let timer = 0;
  const go = () => {
    window.clearTimeout(timer);
    events.forEach((e) => window.removeEventListener(e, go));
    load();
  };
  events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
  timer = window.setTimeout(go, 9000);
}

/** One page view per route change (call from the store layouts). */
export function trackPageView(path) {
  if (!enabled() || isAdminPath()) return;
  start();
  window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href });
  window.fbq?.("track", "PageView");
}

/**
 * Shop events with GA4 names; Meta gets its standard equivalent.
 * @param {"add_to_cart"|"begin_checkout"|"purchase"} name
 * @param {{ value?: number, currency?: string, transaction_id?: string, items?: any[] }} params
 */
export function trackEvent(name, params = {}) {
  if (!enabled() || isAdminPath()) return;
  start();
  const payload = { currency: "PKR", ...params };
  window.gtag?.("event", name, payload);
  const meta = {
    add_to_cart: "AddToCart",
    begin_checkout: "InitiateCheckout",
    purchase: "Purchase",
  }[name];
  if (meta) {
    window.fbq?.("track", meta, {
      value: payload.value,
      currency: payload.currency,
      ...(payload.items
        ? { content_ids: payload.items.map((i) => i.item_id), content_type: "product" }
        : {}),
    });
  }
}
