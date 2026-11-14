import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../auth/session-store";
import { toProductCard } from "../catalog/lib/product-view";
import { syncServerWishlist } from "../wishlist/api";
import { useWishlist } from "../wishlist/wishlist-store";
import { notify } from "../../lib/notify";
import { ApiError } from "../../lib/api/errors";
import { withCrossTabLock } from "../../lib/api/refresh-lock";
import { addServerItem } from "./api";
import { useGuestCart } from "./guest-cart";
import { cartKeys } from "./useCart";

/**
 * Move guest cart lines into the account cart, one by one so a sold-out item can't block the
 * rest. Adding on the server *adds* to the quantity, so each line must be sent exactly once:
 * tabs take turns (Web Lock), re-read the shared guest cart first, and drop each line as soon
 * as it is sent (a tab closed halfway can't resend the finished ones).
 *
 * A line the store refuses (sold out, removed) is dropped with a note; a line that failed
 * because the connection dropped stays on the device and is merged on the next try, so
 * nothing is lost to a bad signal.
 * @returns {Promise<number>} lines now in the account cart
 */
async function mergeGuestCart(queryClient) {
  const failed = [];
  let moved = 0;
  await withCrossTabLock(async () => {
    await useGuestCart.persist.rehydrate();
    for (const line of useGuestCart.getState().lines) {
      try {
        await addServerItem({ variantId: line.variantId, quantity: line.quantity });
        moved += 1;
      } catch (error) {
        const refused = error instanceof ApiError && error.status >= 400 && error.status < 500;
        if (!refused) continue; // offline / server hiccup: keep it for the next attempt
        failed.push(`${line.name}: ${error.message}`);
      }
      useGuestCart.getState().remove(line.variantId);
    }
  }, "adeeb-cart-merge");
  if (!moved && !failed.length) return 0;
  await queryClient.invalidateQueries({ queryKey: cartKeys.server });
  if (failed.length) {
    notify.info("Some items couldn't be moved to your account cart", {
      description: failed.join(" · "),
      duration: 8000,
    });
  }
  return moved;
}

/**
 * Push the device wishlist to the account and pull the account's list back. Runs on every
 * login (not once per browser session), so items saved as a guest after logging out still
 * reach the account the next time the shopper logs in.
 */
function syncWishlist() {
  // Send this device's items, get the account's full list back, and add what's missing here
  // (items saved on a phone show up on the laptop after logging in).
  const ids = useWishlist.getState().items.map((c) => c.id);
  syncServerWishlist(ids)
    .then((products) => {
      const cards = products
        .filter((p) => p?.slug && p.variants?.length)
        .map((p) => toProductCard(p));
      if (cards.length) useWishlist.getState().merge(cards);
    })
    .catch(() => {});
}

/**
 * Runs when a shopper is (or becomes) logged in: merges any guest cart into the account cart
 * and pushes the wishlist. Renders nothing; mounted once in the store layout.
 */
export function SessionSync() {
  const status = useSession((s) => s.status);
  const userId = useSession((s) => s.user?.id);
  const guestLineCount = useGuestCart((s) => s.lines.length);
  const queryClient = useQueryClient();
  const running = useRef(false);
  // The account this page load already synced the wishlist for (re-runs on each new login).
  const syncedUser = useRef(null);

  useEffect(() => {
    if (status !== "authenticated" || !userId || running.current) return;
    running.current = true;
    const firstRunForUser = syncedUser.current !== userId;
    if (firstRunForUser) {
      syncedUser.current = userId;
      syncWishlist();
    }
    mergeGuestCart(queryClient)
      .then((moved) => {
        if (moved && firstRunForUser) {
          notify.info("Your cart and wishlist are saved to your account");
        }
      })
      .finally(() => {
        running.current = false;
      });
  }, [status, userId, guestLineCount, queryClient]);

  return null;
}
