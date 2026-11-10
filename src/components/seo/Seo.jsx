import { useLocation } from "react-router";
import { env } from "../../config/env";
import { site } from "../../config/site";

/**
 * Per-page document metadata. React 19 hoists <title>, <meta> and <link> into <head>
 * automatically, so no helper library is needed.
 *
 * @param {object} props
 * @param {string} [props.title]        Page title (site name is appended)
 * @param {string} [props.description]
 * @param {string} [props.canonicalPath] Defaults to the current path without query string
 * @param {string} [props.image]        Absolute image URL for social previews
 * @param {"website"|"product"} [props.type]
 * @param {boolean} [props.noIndex]     Keep the page out of search results
 * @param {object|object[]} [props.jsonLd] Structured data
 */
export function Seo({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
  noIndex,
  jsonLd,
}) {
  const { pathname } = useLocation();
  const fullTitle = title
    ? `${title} | ${site.name}`
    : `${site.name} — Authentic Sports Nutrition in Pakistan`;
  const canonical = `${env.siteUrl}${canonicalPath ?? pathname}`;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <link rel="canonical" href={canonical} />
      )}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      {jsonLd && (
        <script
          type="application/ld+json"
          // Built from our own data objects, never from user-entered HTML.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
    </>
  );
}
