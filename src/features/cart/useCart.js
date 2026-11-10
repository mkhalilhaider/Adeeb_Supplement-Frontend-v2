import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../auth/session-store";
import { notify } from "../../lib/notify";
import { useGuestCart } from "./guest-cart";
import {
  addServerItem,
  clearServerCart,
  fetchServerCart,
  removeServerItem,
  serverCartToLines,
  setServerItemQuantity,
} from "./api";

export const cartKeys = { server: ["cart", "server"] };

const sum = (lines) => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

/**
 * One cart interface for everyone:
 * - guests: the device cart (instant, persisted);
 * - logged in: the server cart, updated optimistically and rolled back if the server refuses
 *   (e.g. "Only 3 available"), so quantities never wait on the network.
 *
 * @returns {{ lines: import("./guest-cart").CartLine[], count: number, subtotal: number,
 *   source: "guest"|"server", isLoading: boolean, isError: boolean, error: unknown, refetch: () => void,
 *   add: (line: import("./guest-cart").CartLine, quantity: number) => Promise<{quantity: number, capped: boolean}>,
 *   setQuantity: (variantId: string, quantity: number) => Promise<void>,
 *   remove: (variantId: string) => Promise<void>, clear: () => Promise<void> }}
 */
export function useCart() {
  const status = useSession((s) => s.status);
  const server = status === "authenticated";
  const queryClient = useQueryClient();
  const guest = useGuestCart();

  const query = useQuery({
    queryKey: cartKeys.server,
    queryFn: fetchServerCart,
    enabled: server,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    meta: { private: true },
  });

  const lines = useMemo(
    () => (server ? serverCartToLines(query.data) : guest.lines),
    [server, query.data, guest.lines],
  );

  /** Apply a local change to the cached server cart; returns a function that undoes it. */
  const optimistic = (change) => {
    const previous = queryClient.getQueryData(cartKeys.server);
    queryClient.setQueryData(cartKeys.server, (cart) =>
      cart ? { ...cart, items: change(cart.items ?? []) } : cart,
    );
    return () => queryClient.setQueryData(cartKeys.server, previous);
  };

  const store = (cart) => queryClient.setQueryData(cartKeys.server, cart);

  async function add(line, quantity) {
    if (!server) return guest.add(line, quantity);
    // Server errors (out of stock, inactive) are thrown for the caller to show.
    const cart = await addServerItem({ variantId: line.variantId, quantity });
    store(cart);
    const added = serverCartToLines(cart).find((l) => l.variantId === line.variantId);
    return { quantity: added?.quantity ?? quantity, capped: false };
  }

  async function remove(variantId) {
    if (!server) return guest.remove(variantId);
    const rollback = optimistic((items) => items.filter((i) => String(i.variantId) !== variantId));
    try {
      store(await removeServerItem(variantId));
    } catch (error) {
      rollback();
      notify.error(error);
    }
    return undefined;
  }

  async function setQuantity(variantId, quantity) {
    if (!server) return guest.setQuantity(variantId, quantity);
    if (quantity <= 0) return remove(variantId);
    const rollback = optimistic((items) =>
      items.map((i) =>
        String(i.variantId) === variantId
          ? { ...i, quantity, lineTotal: i.unitPrice * quantity }
          : i,
      ),
    );
    try {
      store(await setServerItemQuantity(variantId, quantity));
    } catch (error) {
      rollback();
      notify.error(error);
    }
    return undefined;
  }

  async function clear() {
    if (!server) return guest.clear();
    const rollback = optimistic(() => []);
    try {
      await clearServerCart();
      queryClient.setQueryData(cartKeys.server, (cart) =>
        cart ? { ...cart, items: [], subtotal: 0 } : cart,
      );
    } catch (error) {
      rollback();
      notify.error(error);
    }
    return undefined;
  }

  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: sum(lines),
    source: server ? "server" : "guest",
    isLoading: server && query.isPending,
    isError: server && query.isError,
    error: query.error,
    refetch: query.refetch,
    add,
    setQuantity,
    remove,
    clear,
  };
}
