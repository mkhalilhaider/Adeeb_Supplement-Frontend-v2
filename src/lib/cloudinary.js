/**
 * Cloudinary delivers every product image. Inserting transformations after "/upload/" gives
 * right-sized, modern-format images per screen without any image server of our own.
 *   f_auto  → AVIF/WebP for the browser   q_auto → visually lossless compression
 *   e_trim  → crop the white padding around packshots
 */
const UPLOAD_SEGMENT = "/image/upload/";

export function isCloudinary(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com") && url.includes("/upload/");
}

/**
 * @param {string} url  Original Cloudinary URL
 * @param {{ w?: number, h?: number, crop?: "fit"|"fill"|"pad"|"limit", trim?: boolean, dpr?: number, background?: string }} [opts]
 *   background: hex without "#", used by crop "pad" (e.g. social preview images)
 */
export function cloudinaryUrl(url, { w, h, crop = "limit", trim = false, dpr, background } = {}) {
  if (!isCloudinary(url)) return url;
  const parts = [];
  if (trim) parts.push("e_trim:8");
  const size = ["f_auto", "q_auto", `c_${crop}`];
  if (w) size.push(`w_${Math.round(w)}`);
  if (h) size.push(`h_${Math.round(h)}`);
  if (dpr) size.push(`dpr_${dpr}`);
  if (background) size.push(`b_rgb:${background}`);
  parts.push(size.join(","));

  const segment = url.includes(UPLOAD_SEGMENT) ? UPLOAD_SEGMENT : "/upload/";
  const [before, after] = url.split(segment);
  return `${before}${segment}${parts.join("/")}/${after}`;
}

/** Standard widths: cover phones (1x–3x) through large desktops without too many variants. */
export const DEFAULT_WIDTHS = [160, 240, 320, 480, 640, 800, 1080, 1400];

export function cloudinarySrcSet(url, widths = DEFAULT_WIDTHS, opts = {}) {
  if (!isCloudinary(url)) return undefined;
  return widths.map((w) => `${cloudinaryUrl(url, { ...opts, w })} ${w}w`).join(", ");
}

/** Poster frame for a Cloudinary video (backend reels): same URL with a .jpg extension. */
export function cloudinaryVideoPoster(videoUrl, { w = 540 } = {}) {
  if (typeof videoUrl !== "string" || !videoUrl.includes("/video/upload/")) return undefined;
  const withFrame = videoUrl.replace("/video/upload/", `/video/upload/f_auto,q_auto,w_${w}/`);
  return withFrame.replace(/\.[a-z0-9]+(\?.*)?$/i, ".jpg");
}
