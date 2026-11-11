import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { formatPkPhone, formatPrice, normalizePkPhone } from "../../lib/format";
import { notify } from "../../lib/notify";
import { adminKeys, deleteAbandoned, fetchAbandoned } from "../../features/admin/api";
import { AdminHeader } from "../../features/admin/ui";
import { adminQuery, timeAgo } from "../../features/admin/format";

function reminder(row) {
  const phone = normalizePkPhone(row.phone);
  if (!phone) return null;
  const name = String(row.fullName ?? "").split(" ")[0];
  const text = `Assalam o Alaikum${name ? ` ${name}` : ""}, this is Adeeb Supplement. We noticed you didn't finish your order — can we help with anything?`;
  return `https://wa.me/92${phone.slice(1)}?text=${encodeURIComponent(text)}`;
}

/** /admin/abandoned — checkouts left for more than 30 minutes, for a friendly follow-up. */
export default function AbandonedPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: adminKeys.abandoned,
    queryFn: ({ signal }) => fetchAbandoned({ signal }),
    ...adminQuery,
  });

  const dismiss = async (row) => {
    queryClient.setQueryData(adminKeys.abandoned, (list) => list?.filter((r) => r._id !== row._id));
    try {
      await deleteAbandoned(row._id);
    } catch (err) {
      notify.error(err);
      queryClient.invalidateQueries({ queryKey: adminKeys.abandoned });
    }
  };

  return (
    <div className="max-w-4xl">
      <AdminHeader
        title="Abandoned checkouts"
        description="People who started checkout and stopped for more than 30 minutes. Finished orders drop off this list on their own."
      />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <Skeleton className="h-60" />
      ) : query.data.length === 0 ? (
        <p className="rounded-sm border border-line bg-surface p-10 text-center text-ink-3">
          No abandoned checkouts right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {query.data.map((row) => {
            const wa = reminder(row);
            return (
              <li key={row._id} className="rounded-sm border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{row.fullName || "No name given"}</p>
                    <p className="text-small text-ink-3">
                      {[row.phone && formatPkPhone(row.phone), row.email, row.city]
                        .filter(Boolean)
                        .join(" · ") || "No contact details"}{" "}
                      · {timeAgo(row.lastActivityAt)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatPrice(row.subtotal)}</p>
                </div>
                <ul className="mt-2 text-small text-ink-2">
                  {row.items.map((i) => (
                    <li key={i.variantId}>
                      {i.quantity} × {i.productName}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wa && (
                    <Button
                      size="sm"
                      variant="outline"
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      leadingIcon={<MessagesSquare className="size-4" />}
                    >
                      WhatsApp reminder
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => dismiss(row)}>
                    Dismiss
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
