import { useQuery } from "@tanstack/react-query";
import { fetchMyOrder, fetchMyOrders } from "../orders/api";
import { accountKeys, fetchAddresses, fetchProfile } from "./api";

const privateQuery = { meta: { private: true } };

/**
 * Order status changes on the shop's side (confirmed, shipped, delivered…), so order queries
 * re-check every 30 s while the page is open and whenever the shopper comes back to the tab —
 * no manual refresh needed. Polling pauses while the tab is in the background.
 */
const liveOrders = {
  staleTime: 15_000,
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
};

export const useProfile = () =>
  useQuery({
    queryKey: accountKeys.profile,
    queryFn: ({ signal }) => fetchProfile({ signal }),
    staleTime: 5 * 60_000,
    ...privateQuery,
  });

export const useAddresses = () =>
  useQuery({
    queryKey: accountKeys.addresses,
    queryFn: ({ signal }) => fetchAddresses({ signal }),
    staleTime: 5 * 60_000,
    ...privateQuery,
  });

export const useMyOrders = () =>
  useQuery({
    queryKey: accountKeys.orders,
    queryFn: ({ signal }) => fetchMyOrders({ signal }),
    ...liveOrders,
    ...privateQuery,
  });

/** One order; shown instantly from the orders list when it's already loaded. */
export function useMyOrder(id, queryClient) {
  return useQuery({
    queryKey: accountKeys.order(id),
    queryFn: ({ signal }) => fetchMyOrder(id, { signal }),
    ...liveOrders,
    initialData: () =>
      queryClient
        .getQueryData(accountKeys.orders)
        ?.find((o) => o._id === id || o.orderNumber === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(accountKeys.orders)?.dataUpdatedAt,
    ...privateQuery,
  });
}
