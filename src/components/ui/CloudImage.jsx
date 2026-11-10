import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cloudinarySrcSet, cloudinaryUrl, isCloudinary } from "../../lib/cloudinary";
import { cn } from "../../lib/cn";

const ratios = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/9]",
  reel: "aspect-[9/16]",
};

/**
 * Responsive image with a fixed aspect ratio (no layout shift). Cloudinary URLs get a srcset of
 * right-sized AVIF/WebP files; everything else renders as-is.
 *
 * @param {object} props
 * @param {string|null|undefined} props.src
 * @param {string} props.alt              Describe the product; "" only for purely decorative images
 * @param {keyof typeof ratios | null} [props.ratio]  null = parent controls the size
 * @param {string} [props.sizes]          e.g. "(min-width: 1024px) 25vw, 50vw"
 * @param {"contain"|"cover"} [props.fit] Packshots use contain (never crop packaging)
 * @param {boolean} [props.priority]      Above-the-fold image (LCP): eager + high priority
 * @param {boolean} [props.trim]          Crop white padding around packshots
 * @param {boolean} [props.blend]         Multiply-blend white backgrounds into the tile colour
 */
export function CloudImage({
  src,
  alt,
  ratio = "square",
  sizes = "100vw",
  fit = "contain",
  priority = false,
  trim = false,
  blend = false,
  className,
  imgClassName,
}) {
  // Remember which URL failed, so a new `src` (e.g. another variant) gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState(null);
  const show = src && failedSrc !== src;

  return (
    <span className={cn("relative block overflow-hidden", ratio && ratios[ratio], className)}>
      {show ? (
        <img
          src={isCloudinary(src) ? cloudinaryUrl(src, { w: 640, trim }) : src}
          srcSet={cloudinarySrcSet(src, undefined, { trim })}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setFailedSrc(src)}
          className={cn(
            "absolute inset-0 size-full",
            fit === "contain" ? "object-contain" : "object-cover",
            blend && "mix-blend-multiply",
            imgClassName,
          )}
        />
      ) : (
        <span
          role="img"
          aria-label={alt || "Image unavailable"}
          className="absolute inset-0 flex items-center justify-center text-ink-3"
        >
          <ImageOff aria-hidden="true" className="size-6" />
        </span>
      )}
    </span>
  );
}
