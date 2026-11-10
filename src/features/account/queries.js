import { useQuery } from "@tanstack/react-query";
import { fetchMyOrder, fetchMyOrders } from "../orders/api";
import { accountKeys, fetchAddresses, fetchProfile } from "./api";

const privateQuery = { meta: { private: true } };

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
    staleTime: 60_000,
    ...privateQuery,
  });

/** One order; shown instantly from the orders list when it's already loaded. */
export function useMyOrder(id, queryClient) {
  return useQuery({
    queryKey: accountKeys.order(id),
    queryFn: ({ signal }) => fetchMyOrder(id, { signal }),
    staleTime: 60_000,
    initialData: () =>
      queryClient
        .getQueryData(accountKeys.orders)
        ?.find((o) => o._id === id || o.orderNumber === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(accountKeys.orders)?.dataUpdatedAt,
    ...privateQuery,
  });
}
