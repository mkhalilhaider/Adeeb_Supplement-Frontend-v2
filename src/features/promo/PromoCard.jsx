import { X } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * The promo popup's content: optional image, small label, headline, message, button and
 * "No thanks". Used by the storefront popup and by the live preview in Admin → Promo popup,
 * so what the admin sees is exactly what shoppers get.
 *
 * @param {{ popup: any, onAction?: () => void, onClose?: () => void, progress?: number|null,
 *   compact?: boolean, TitleTag?: any }} props
 */
export function PromoCard({
  popup,
  onAction,
  onClose,
  progress = null,
  compact = false,
  TitleTag = "h2",
}) {
  const showImage = popup.layout !== "text" && popup.image?.url;
  const showText = popup.layout !== "image";
  const wide = !compact && showImage && showText;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface text-ink",
        wide ? "grid md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]" : "flex flex-col",
      )}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-shelf/90 text-ink transition-colors hover:bg-line"
        >
          <X aria-hidden="true" className="size-4.5" />
        </button>
      )}
      {showImage && (
        <div className={cn("bg-night-deep", wide ? "md:min-h-[340px]" : "")}>
          <img
            src={popup.image.url}
            alt=""
            className={cn(
              "block w-full object-cover",
              wide ? "h-48 md:h-full" : showText ? "h-44" : "max-h-[70vh] object-contain",
            )}
          />
        </div>
      )}
      <div className={cn("flex flex-col gap-3", showText ? "p-6 md:p-7" : "p-4")}>
        {showText && (
          <>
            {popup.eyebrow && <p className="label-caps text-brand-ink">{popup.eyebrow}</p>}
            {popup.title && (
              <TitleTag className="pr-8 text-[2rem] font-display leading-[0.95] md:text-[2.5rem]">
                {popup.title}
              </TitleTag>
            )}
            {popup.message && (
              <p className="text-[15px] leading-relaxed text-ink-2">{popup.message}</p>
            )}
          </>
        )}
        {popup.ctaLabel && (
          <button
            type="button"
            onClick={onAction}
            className="glide mt-1 inline-flex h-12 w-full items-center justify-center rounded-md bg-brand px-5 font-bold text-ink hover:bg-brand-hover active:scale-[0.98]"
          >
            <span className="glide-label">
              <span className="glide-icon glide-auto" aria-hidden="true">
                →
              </span>
              {popup.ctaLabel}
            </span>
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="self-center text-small text-ink-3 underline-offset-4 hover:text-ink hover:underline"
          >
            No thanks
          </button>
        )}
        {progress != null && (
          <span
            aria-hidden="true"
            className="mt-1 block h-[3px] overflow-hidden rounded-full bg-line"
          >
            <span
              className="block h-full bg-brand"
              style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
            />
          </span>
        )}
      </div>
    </div>
  );
}
