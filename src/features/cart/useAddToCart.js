import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchProduct } from "../catalog/api";
import { catalogKeys } from "../catalog/queries";
import { isPurchasable, paidPrice, variantImage } from "../catalog/lib/product-view";
import { notify } from "../../lib/notify";
import { useGuestCart } from "./guest-cart";

/**
 * Add a variant to the cart, re-checking stock first: the page may have been open a while, so
 * the product is refreshed if its data is older than 30s (usually no request at all).
 * Phase 4 routes logged-in shoppers to the server cart behind this same hook.
 *
 * @returns {{ add: (product: any, variant: any, quantity: number) => Promise<boolean>, pending: boolean }}
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  const addLine = useGuestCart((s) => s.add);
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

      const { quantity: inCart, capped } = addLine(
        {
          variantId: current._id,
          productId: fresh._id,
          slug: fresh.slug,
          name: fresh.name,
          brand: fresh.brand?.name ?? "",
          attributes: current.attributes ?? {},
          image:
            variantImage(current) ?? variantImage(fresh.variants.find((v) => v.isDefault)) ?? null,
          unitPrice: paidPrice(current),
          maxQuantity: current.stockQuantity,
        },
        quantity,
      );

      if (capped) {
        notify.info(`Only ${current.stockQuantity} available`, {
          description: `Your cart now has ${inCart}, the most we can send.`,
        });
      } else {
        notify.success("Added to cart", {
          description: `${quantity} × ${fresh.name}`,
        });
      }
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
