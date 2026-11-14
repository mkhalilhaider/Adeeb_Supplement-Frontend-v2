import { useState } from "react";
import { trackEvent } from "../../lib/track";
import { useQueryClient } from "@tanstack/react-query";
import { fetchProduct } from "../catalog/api";
import { catalogKeys } from "../catalog/queries";
import { isPurchasable, paidPrice, variantImage } from "../catalog/lib/product-view";
import { notify } from "../../lib/notify";
import { useCart } from "./useCart";
import { useCartUi } from "./cart-ui";

/** The cart line for one variant of a freshly fetched product. */
export function toCartLine(product, variant) {
  return {
    variantId: variant._id,
    productId: product._id,
    slug: product.slug,
    name: product.name,
    brand: product.brand?.name ?? "",
    attributes: variant.attributes ?? {},
    image: variantImage(variant) ?? variantImage(product.variants.find((v) => v.isDefault)) ?? null,
    unitPrice: paidPrice(variant),
    maxQuantity: variant.stockQuantity,
  };
}

/**
 * Add a variant to the cart, re-checking stock first: the page may have been open a while, so
 * the product is refreshed if its data is older than 30s (usually no request at all).
 * Works for guests (device cart) and logged-in shoppers (server cart) alike, then opens the cart
 * drawer with the new line highlighted.
 *
 * @returns {{ add: (product: any, variant: any, quantity: number) => Promise<boolean>, pending: boolean }}
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  const cart = useCart();
  const openDrawer = useCartUi((s) => s.openDrawer);
  const [pending, setPending] = useState(false);

  const add = async (product, variant, quantity) => {
    if (pending) return false;
    setPending(true);
    try {
      const fresh = await queryClient.fetchQuery({
        queryKey: catalogKeys.product(product.slug),
        queryFn: ({ signal }) => fetchProduct(product.slug, { signal }),
        staleTime: 30_000,
      });
      const current = fresh.variants.find((v) => v._id === variant._id);
      if (!current || !isPurchasable(current)) {
        notify.error("Sorry, this option just sold out.");
        return false;
      }

      const { quantity: inCart, capped } = await cart.add(toCartLine(fresh, current), quantity);

      if (capped) {
        notify.info(`Only ${current.stockQuantity} available`, {
          description: `Your cart now has ${inCart}, the most we can send.`,
        });
      }
      trackEvent("add_to_cart", {
        value: paidPrice(current) * quantity,
        items: [{ item_id: fresh._id, item_name: fresh.name, price: paidPrice(current), quantity }],
      });
      openDrawer(current._id);
      return true;
    } catch (error) {
      notify.error(error);
      return false;
    } finally {
      setPending(false);
    }
  };

  return { add, pending };
}
