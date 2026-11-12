import { lazy, Suspense, useState } from "react";
import { Expand } from "lucide-react";
import { CloudImage } from "../../../components/ui/CloudImage";
import { cn } from "../../../lib/cn";
import { useIsDesktop } from "../../../lib/useMediaQuery";

import { GallerySlide } from "./GallerySlide";

// The full-screen viewer (and its dialog code) loads on first open.
const ImageViewer = lazy(() => import("./ImageViewer"));
// The swipe carousel loads after the first image is already showing (static slide meanwhile).
const MobileCarousel = lazy(() => import("./MobileCarousel"));

/** Desktop main image: zooms 2× toward the cursor while hovering (no extra library). */
function ZoomImage({ image, alt, priority, onOpen }) {
  const [origin, setOrigin] = useState(null);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open full-size image: ${alt}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(
          `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
        );
      }}
      onMouseLeave={() => setOrigin(null)}
      className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-card border border-line bg-shelf bg-[radial-gradient(70%_60%_at_50%_55%,#ffffff,var(--color-shelf))]"
    >
      <span
        className="absolute inset-[6%] block transition-transform duration-(--duration-base) ease-(--ease-out-soft)"
        style={origin ? { transform: "scale(2)", transformOrigin: origin } : undefined}
      >
        <CloudImage
          src={image?.url}
          alt={alt}
          ratio={null}
          sizes="(min-width: 80rem) 640px, 50vw"
          priority={priority}
          trim
          blend
          className="size-full"
        />
      </span>
      <Expand
        aria-hidden="true"
        className="absolute right-3 bottom-3 size-5 text-ink-2 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </button>
  );
}

/**
 * Product images. Phones: swipeable slides with dots. Desktop: main image with hover zoom and
 * thumbnails. Both open a full-screen viewer. Re-key it when the variant changes so it starts
 * at the first image.
 *
 * @param {{ images: { url: string }[], alt: string }} props
 */
export function ProductGallery({ images, alt }) {
  const isDesktop = useIsDesktop();
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const openViewer = () => {
    if (!images.length) return;
    setViewerLoaded(true);
    setViewer(true);
  };
  const slides = images.length ? images : [null];

  return (
    <div className="md:grid md:grid-cols-[4.5rem_1fr] md:gap-3">
      {/* Phones. Only one layout is rendered, so the main image downloads once. */}
      {!isDesktop &&
        (slides.length > 1 ? (
          <Suspense
            fallback={
              <GallerySlide image={slides[0]} alt={alt} priority onOpen={openViewer} bleed />
            }
          >
            <MobileCarousel
              images={slides}
              alt={alt}
              index={index}
              onIndexChange={setIndex}
              onOpen={openViewer}
            />
          </Suspense>
        ) : (
          <GallerySlide image={slides[0]} alt={alt} priority onOpen={openViewer} bleed />
        ))}

      {/* Desktop: thumbnails + zoomable main image */}
      {isDesktop && slides.length > 1 && (
        <ul className="flex flex-col gap-2" aria-label="Choose image">
          {slides.map((image, i) => (
            <li key={image?.url ?? i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded-md border bg-shelf p-1.5",
                  i === index ? "border-ink" : "border-transparent hover:border-line-strong",
                )}
              >
                <CloudImage
                  src={image?.url}
                  alt=""
                  ratio={null}
                  sizes="72px"
                  trim
                  blend
                  className="size-full"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {isDesktop && slides.length <= 1 && <span />}
      {isDesktop && (
        <div>
          <ZoomImage image={slides[index]} alt={alt} priority onOpen={openViewer} />
        </div>
      )}

      {viewerLoaded && (
        <Suspense fallback={null}>
          <ImageViewer
            open={viewer}
            onOpenChange={setViewer}
            images={images}
            index={index}
            setIndex={setIndex}
            alt={alt}
          />
        </Suspense>
      )}
    </div>
  );
}
