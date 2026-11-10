import { useQueries } from "@tanstack/react-query";
import { fetchDeliveryQuote } from "./api";

const ONE_HOUR = 60 * 60_000;

/**
 * Karachi and other-cities fees (subtotal 0 = base fee) for the product page's delivery line.
 * Two small requests, cached an hour and persisted, so most visits make none.
 */
export function useDeliveryFees() {
  const [karachi, other] = useQueries({
    queries: [
      { city: "Karachi", key: "karachi" },
      { city: "Lahore", key: "other" },
    ].map(({ city, key }) => ({
      queryKey: ["delivery", "base-fee", key],
      queryFn: ({ signal }) => fetchDeliveryQuote({ city, subtotal: 0 }, { signal }),
      staleTime: ONE_HOUR,
      meta: { persist: true },
    })),
  });

  if (!karachi.data || !other.data) {
    return {
      isPending: karachi.isPending || other.isPending,
      isError: karachi.isError || other.isError,
      fees: null,
    };
  }
  return {
    isPending: false,
    isError: false,
    fees: {
      karachi: karachi.data.shippingFee,
      other: other.data.shippingFee,
      freeThreshold: karachi.data.freeDeliveryThreshold,
    },
  };
}
