import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../auth/session-store";
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
 */
async function mergeGuestCart(queryClient) {
  const failed = [];
  let merged = false;
  await withCrossTabLock(async () => {
    await useGuestCart.persist.rehydrate();
    for (const line of useGuestCart.getState().lines) {
      try {
        await addServerItem({ variantId: line.variantId, quantity: line.quantity });
      } catch (error) {
        failed.push(`${line.name}: ${error instanceof ApiError ? error.message : "unavailable"}`);
      }
      useGuestCart.getState().remove(line.variantId);
      merged = true;
    }
  }, "adeeb-cart-merge");
  if (!merged) return;
  await queryClient.invalidateQueries({ queryKey: cartKeys.server });
  if (failed.length) {
    notify.info("Some items couldn't be moved to your account cart", {
      description: failed.join(" · "),
      duration: 8000,
    });
  }
}

/** Push the device wishlist to the server once per browser session per account. */
function syncWishlistOnce(userId) {
  const flag = `adeeb.wishlist-synced.${userId}`;
  try {
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
  } catch {
    /* storage blocked: sync anyway */
  }
  const ids = useWishlist.getState().items.map((c) => c.id);
  if (ids.length) syncServerWishlist(ids).catch(() => {});
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

  useEffect(() => {
    if (status !== "authenticated" || !userId || running.current) return;
    running.current = true;
    syncWishlistOnce(userId);
    mergeGuestCart(queryClient).finally(() => {
      running.current = false;
    });
  }, [status, userId, guestLineCount, queryClient]);

  return null;
}
