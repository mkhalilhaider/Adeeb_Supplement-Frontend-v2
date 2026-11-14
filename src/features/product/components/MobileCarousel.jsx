import { useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "../../../lib/cn";
import { GallerySlide } from "./GallerySlide";

/**
 * Swipeable images for phones (Embla). Loaded after the first image is already on screen, so
 * the main image never waits for this code.
 */
export default function MobileCarousel({ images, alt, index, onIndexChange, onOpen }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, align: "start", startIndex: index });

  useEffect(() => {
    if (!embla) return undefined;
    const onSelect = () => onIndexChange(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => embla.off("select", onSelect);
  }, [embla, onIndexChange]);

  const show = useCallback(
    (i) => {
      onIndexChange(i);
      embla?.scrollTo(i);
    },
    [embla, onIndexChange],
  );

  return (
    <div>
      <div
        ref={emblaRef}
        className="-mx-4 overflow-hidden"
        aria-roledescription="carousel"
        aria-label="Product images"
      >
        <div className="flex">
          {images.map((image, i) => (
            <div
              key={image.url}
              className="min-w-0 flex-[0_0_100%]"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
            >
              <GallerySlide
                image={image}
                alt={i === 0 ? alt : ""}
                priority={i === 0}
                onOpen={onOpen}
              />
            </div>
          ))}
        </div>
      </div>
      {/* 32px tap targets; the visible dots keep their spacing. */}
      <div className="mt-2 flex justify-center">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show image ${i + 1}`}
            aria-current={i === index}
            onClick={() => show(i)}
            className="flex size-8 items-center justify-center"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-ink" : "w-1.5 bg-line-strong",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
