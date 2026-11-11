import { next, rewrite } from "@vercel/functions";

/**
 * Two jobs, both at the edge before the app loads:
 *
 * 1. Link previews: WhatsApp, Facebook, X, LinkedIn, Telegram, Slack, Discord and Pinterest
 *    don't run JavaScript, so their crawlers are rewritten to /api/preview (Open Graph +
 *    JSON-LD). Everyone else, search engines included, gets the normal app (no cloaking).
 *
 * 2. Optional second lock on /admin: when ADMIN_BASIC_AUTH ("user:password") is set in the
 *    Vercel environment, the browser asks for that password before the admin app even loads.
 *    The admin login and the backend's role check still apply behind it.
 */
export const config = {
  matcher: ["/product/:path*", "/category/:path*", "/brand/:path*", "/admin", "/admin/:path*"],
};

const PREVIEW_BOTS =
  /facebookexternalhit|facebookcatalog|facebot|meta-externalagent|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|slack-imgproxy|discordbot|pinterest|skypeuripreview|redditbot|embedly|vkshare|tumblr|viber|snapchat/i;

/** Compare without leaking how many characters matched. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function adminGate(request) {
  const expected = process.env.ADMIN_BASIC_AUTH;
  if (!expected) return null;
  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  let given = "";
  try {
    given = scheme === "Basic" && encoded ? atob(encoded) : "";
  } catch {
    given = "";
  }
  if (safeEqual(given, expected)) return null;
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Adeeb admin", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export default function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    return adminGate(request) ?? next();
  }

  const agent = request.headers.get("user-agent") ?? "";
  if (!PREVIEW_BOTS.test(agent)) return next();
  return rewrite(new URL(`/api/preview?path=${encodeURIComponent(url.pathname)}`, url));
}
