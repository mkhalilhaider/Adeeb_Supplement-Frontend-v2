import { useNavigate } from "react-router";
import { Heart } from "lucide-react";
import { cn } from "../../lib/cn";
import { useWishlist } from "./wishlist-store";

/**
 * Save / unsave a product. `aria-pressed` tells screen readers the current state; the heart
 * fills in brand orange when saved.
 * @param {{ card: import("../catalog/lib/product-view").ProductCardModel, className?: string }} props
 */
export function WishlistButton({ card, className }) {
  const saved = useWishlist((s) => s.items.some((c) => c.id === card.id));
  const toggle = useWishlist((s) => s.toggle);
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Saved to wishlist" : "Save to wishlist"}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
      onClick={() => {
        const nowSaved = toggle(card);
        import("./wishlist-toasts").then(({ wishlistToast }) =>
          wishlistToast(nowSaved, { view: () => navigate("/wishlist"), undo: () => toggle(card) }),
        );
      }}
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-md border transition-colors duration-(--duration-fast)",
        saved ? "border-ink bg-surface" : "border-line-strong bg-surface hover:border-ink",
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn("size-5", saved ? "fill-brand stroke-brand-ink" : "fill-transparent")}
      />
    </button>
  );
}
