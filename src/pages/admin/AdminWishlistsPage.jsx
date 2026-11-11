import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { adminKeys, fetchWishlists } from "../../features/admin/api";
import { AdminHeader, EmptyRow, Pagination, Table } from "../../features/admin/ui";
import { adminQuery, td, th, timeAgo } from "../../features/admin/format";

/** /admin/wishlists — what logged-in customers saved (guests' wishlists stay on their device). */
export default function WishlistsPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: adminKeys.wishlists(page),
    queryFn: ({ signal }) => fetchWishlists({ page }, { signal }),
    placeholderData: keepPreviousData,
    ...adminQuery,
  });

  // Most-wanted products across this page of wishlists.
  const counts = new Map();
  for (const w of query.data?.wishlists ?? [])
    for (const p of w.products ?? []) counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="max-w-5xl">
      <AdminHeader
        title="Wishlists"
        description="Saved products of logged-in customers. Guests' wishlists stay on their own device."
      />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <Skeleton className="h-60" />
      ) : (
        <>
          {top.length > 0 && (
            <p className="mb-4 text-small text-ink-2">
              Most saved: {top.map(([name, n]) => `${name} (${n})`).join(" · ")}
            </p>
          )}
          <Table label="Wishlists">
            <thead>
              <tr>
                <th className={th}>Customer</th>
                <th className={th}>Saved products</th>
                <th className={th}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {query.data.wishlists.length === 0 && (
                <EmptyRow colSpan={3}>No wishlists yet.</EmptyRow>
              )}
              {query.data.wishlists.map((w) => (
                <tr key={w._id}>
                  <td className={td}>
                    <span className="block font-medium">
                      {[w.userId?.firstName, w.userId?.lastName].filter(Boolean).join(" ") ||
                        "Customer"}
                    </span>
                    <span className="text-ink-3">{w.userId?.email}</span>
                  </td>
                  <td className={td}>
                    {(w.products ?? []).length ? (
                      <ul className="flex flex-col gap-0.5">
                        {w.products.map((p) => (
                          <li key={p._id}>
                            <a
                              href={`/product/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {p.name}
                            </a>
                            {p.brand?.name && <span className="text-ink-3"> · {p.brand.name}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-ink-3">Empty</span>
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap text-ink-3`}>{timeAgo(w.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={query.data.page}
            pages={query.data.pages}
            total={query.data.total}
            label="wishlists"
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}
