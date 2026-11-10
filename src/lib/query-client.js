import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ApiError } from "./api/errors";

/**
 * Defaults tuned for a small catalog:
 * - data stays "fresh" 60s, so navigating back and forth doesn't refetch;
 * - one automatic retry, only for network/timeout/5xx (never for 4xx);
 * - no refetch on window focus by default (cart/orders opt in per query).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        failureCount < 1 && (!(error instanceof ApiError) || error.isRetryable),
    },
    mutations: { retry: 0 },
  },
});

function safeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Only queries that opt in with `meta: { persist: true }` survive a reload (taxonomy, fees). */
export const persistOptions = {
  persister: createSyncStoragePersister({ storage: safeLocalStorage(), key: "adeeb.cache" }),
  maxAge: 60 * 60_000,
  buster: "v1",
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.meta?.persist === true && query.state.status === "success",
  },
};
