import { next, rewrite } from "@vercel/functions";

/**
 * Link previews: WhatsApp, Facebook, X, LinkedIn, Telegram, Slack, Discord and Pinterest don't
 * run JavaScript, so a shared product/category/brand link would show an empty preview. Their
 * crawlers are rewritten to /api/preview (Open Graph + JSON-LD); everyone else, search engines
 * included, gets the normal app (no special content for Google = no cloaking).
 */
export const config = {
  matcher: ["/product/:path*", "/category/:path*", "/brand/:path*"],
};

const PREVIEW_BOTS =
  /facebookexternalhit|facebookcatalog|facebot|meta-externalagent|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|slack-imgproxy|discordbot|pinterest|skypeuripreview|redditbot|embedly|vkshare|tumblr|viber|snapchat/i;

export default function middleware(request) {
  const agent = request.headers.get("user-agent") ?? "";
  if (!PREVIEW_BOTS.test(agent)) return next();
  const url = new URL(request.url);
  return rewrite(new URL(`/api/preview?path=${encodeURIComponent(url.pathname)}`, url));
}
