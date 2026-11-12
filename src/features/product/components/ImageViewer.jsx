import * as RadixDialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { IconButton } from "../../../components/ui/Button";
import { cloudinaryUrl } from "../../../lib/cloudinary";
import { useReturnFocus } from "../../../lib/hooks";

/** Full-screen viewer. Phones can pinch-zoom natively (the page zoom isn't disabled). */
export default function ImageViewer({ open, onOpenChange, images, index, setIndex, alt }) {
  const count = images.length;
  const go = (d) => setIndex((i) => (i + d + count) % count);
  const image = images[index];
  const returnFocus = useReturnFocus();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Content
          {...returnFocus}
          aria-describedby={undefined}
          onKeyDown={(e) => {
            if (count > 1 && e.key === "ArrowRight") go(1);
            if (count > 1 && e.key === "ArrowLeft") go(-1);
          }}
          className="fixed inset-0 z-50 flex flex-col bg-surface outline-none"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <RadixDialog.Title className="label-caps text-ink-3">
              {count > 1 ? `Image ${index + 1} of ${count}` : "Image"}
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton label="Close image viewer">
                <X aria-hidden="true" className="size-6" />
              </IconButton>
            </RadixDialog.Close>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
            {image && (
              <img
                src={cloudinaryUrl(image.url, { w: 1400, trim: true })}
                alt={alt}
                className="max-h-full max-w-full object-contain"
              />
            )}
            {count > 1 && (
              <>
                <IconButton
                  label="Previous image"
                  variant="outline"
                  onClick={() => go(-1)}
                  className="absolute left-3 bg-surface"
                >
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </IconButton>
                <IconButton
                  label="Next image"
                  variant="outline"
                  onClick={() => go(1)}
                  className="absolute right-3 bg-surface"
                >
                  <ChevronRight aria-hidden="true" className="size-5" />
                </IconButton>
              </>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
