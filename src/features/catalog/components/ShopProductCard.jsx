import { useCartUi } from "../../cart/cart-ui";
import { useAddToCart } from "../../cart/useAddToCart";
import { useWishlist } from "../../wishlist/wishlist-store";
import { ProductCard } from "./ProductCard";

/**
 * ProductCard wired to the cart and wishlist. Quick add puts a single-option product straight
 * in the cart and opens the options sheet for products with flavours/sizes.
 */
export function ShopProductCard({ card, priority }) {
  const saved = useWishlist((s) => s.items.some((c) => c.id === card.id));
  const toggle = useWishlist((s) => s.toggle);
  const openQuickAdd = useCartUi((s) => s.openQuickAdd);
  const { add } = useAddToCart();

  return (
    <ProductCard
      card={card}
      priority={priority}
      wishlisted={saved}
      onToggleWishlist={toggle}
      onQuickAdd={(c) =>
        c.quickAddVariantId
          ? add({ slug: c.slug }, { _id: c.quickAddVariantId }, 1)
          : openQuickAdd(c.slug)
      }
    />
  );
}
