import { CloudImage } from "../../../components/ui/CloudImage";

/** One full-width phone image (also the placeholder shown while the carousel code loads). */
export function GallerySlide({ image, alt, priority = false, onOpen, bleed = false }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open full-size image: ${alt || "product"}`}
      className={`block aspect-square w-full bg-shelf p-[6%] ${bleed ? "-mx-4 w-[calc(100%+2rem)]" : ""}`}
    >
      <CloudImage
        src={image?.url}
        alt={alt}
        ratio={null}
        sizes="100vw"
        priority={priority}
        trim
        blend
        className="size-full"
      />
    </button>
  );
}
