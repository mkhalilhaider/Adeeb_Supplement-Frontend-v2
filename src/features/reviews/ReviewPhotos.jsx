import { useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CloudImage } from "../../components/ui/CloudImage";
import { cloudinaryUrl } from "../../lib/cloudinary";
import { cn } from "../../lib/cn";

/**
 * Full-screen look at the photos a reviewer posted with their review: arrows (and ← →) to move
 * between them, Esc / backdrop / × to close.
 * @param {{ photos: {url: string}[], name: string, index: number | null,
 *   onIndexChange: (i: number | null) => void }} props
 */
export function ReviewPhotoViewer({ photos, name, index, onIndexChange }) {
  const open = index !== null;
  const count = photos.length;
  const go = (step) => onIndexChange((index + step + count) % count);
  const photo = open ? photos[index] : null;

  return (
    <RadixDialog.Root open={open} onOpenChange={(o) => !o && onIndexChange(null)}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/85 data-[state=open]:animate-[fade-in_150ms]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          onKeyDown={(e) => {
            if (count < 2) return;
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-[state=open]:animate-[fade-in_200ms] sm:p-10"
        >
          <RadixDialog.Title className="sr-only">
            Photo {index + 1} of {count} from {name}'s review
          </RadixDialog.Title>
          {photo && (
            <img
              key={photo.url}
              src={cloudinaryUrl(photo.url, { w: 1400, h: 1400 })}
              alt={`Posted with ${name}'s review (${index + 1} of ${count})`}
              className="max-h-full max-w-full rounded-md object-contain shadow-overlay"
            />
          )}
          <RadixDialog.Close
            aria-label="Close photo"
            className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X aria-hidden="true" className="size-6" />
          </RadixDialog.Close>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft aria-hidden="true" className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight aria-hidden="true" className="size-6" />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-small font-semibold text-white tabular-nums">
                {index + 1} / {count}
              </p>
            </>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/**
 * Small square thumbnails of a review's photos (product page); each opens the viewer.
 * @param {{ photos?: {url: string}[], name: string, className?: string }} props
 */
export function ReviewPhotoStrip({ photos = [], name, className }) {
  const [index, setIndex] = useState(/** @type {number|null} */ (null));
  if (!photos.length) return null;
  return (
    <>
      <ul className={cn("flex flex-wrap gap-2", className)}>
        {photos.map((photo, i) => (
          <li key={photo.url}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block overflow-hidden rounded-md border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <CloudImage
                src={photo.url}
                alt={`Photo ${i + 1} from ${name}'s review — open larger`}
                ratio="square"
                fit="cover"
                sizes="96px"
                className="size-20 md:size-24"
                imgClassName="transition-transform duration-(--duration-base) group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>
      <ReviewPhotoViewer photos={photos} name={name} index={index} onIndexChange={setIndex} />
    </>
  );
}
