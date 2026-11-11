import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessagesSquare, Phone } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { cn } from "../../lib/cn";
import { formatPkPhone, normalizePkPhone } from "../../lib/format";
import { notify } from "../../lib/notify";
import { adminKeys, fetchInquiries, setInquiryStatus } from "../../features/admin/api";
import { AdminHeader } from "../../features/admin/ui";
import { adminQuery, shortDateTime } from "../../features/admin/format";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "responded", label: "Replied" },
];

/** /admin/inquiries — messages from the contact form, newest first. */
export default function InquiriesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: adminKeys.inquiries,
    queryFn: ({ signal }) => fetchInquiries({ signal }),
    ...adminQuery,
  });
  const [show, setShow] = useState("open");

  const update = async (inquiry, status) => {
    queryClient.setQueryData(adminKeys.inquiries, (list) =>
      list?.map((i) => (i._id === inquiry._id ? { ...i, status } : i)),
    );
    try {
      await setInquiryStatus(inquiry._id, status);
    } catch (err) {
      notify.error(err);
      queryClient.invalidateQueries({ queryKey: adminKeys.inquiries });
    }
  };

  const list = (query.data ?? []).filter((i) =>
    show === "open" ? i.status !== "responded" : true,
  );
  const newCount = (query.data ?? []).filter((i) => i.status === "new").length;

  return (
    <div className="max-w-4xl">
      <AdminHeader
        title="Inquiries"
        description={
          newCount
            ? `${newCount} new message${newCount === 1 ? "" : "s"}.`
            : "Messages from the contact page."
        }
        actions={
          <Select
            value={show}
            onChange={(e) => setShow(e.target.value)}
            className="!h-10 w-44"
            aria-label="Show"
          >
            <option value="open">Not replied yet</option>
            <option value="all">All messages</option>
          </Select>
        }
      />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <Skeleton className="h-60" />
      ) : list.length === 0 ? (
        <p className="rounded-sm border border-line bg-surface p-10 text-center text-ink-3">
          Nothing to reply to.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((i) => {
            const mobile = normalizePkPhone(i.phone);
            return (
              <li
                key={i._id}
                className={cn(
                  "rounded-sm border bg-surface p-4",
                  i.status === "new" ? "border-ink" : "border-line",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {i.name}
                      {i.status === "new" && (
                        <span className="ml-2 rounded-sm bg-brand px-1.5 py-0.5 text-[11px]">
                          New
                        </span>
                      )}
                    </p>
                    <p className="text-small text-ink-3">
                      {formatPkPhone(i.phone)}
                      {i.email && ` · ${i.email}`} · {shortDateTime(i.createdAt)}
                    </p>
                  </div>
                  <label className="text-small">
                    <span className="sr-only">Status for {i.name}</span>
                    <Select
                      value={i.status}
                      onChange={(e) => update(i, e.target.value)}
                      className="!h-9 w-36"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
                <p className="mt-3 text-small whitespace-pre-line">{i.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mobile && (
                    <Button
                      size="sm"
                      variant="outline"
                      href={`https://wa.me/92${mobile.slice(1)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      leadingIcon={<MessagesSquare className="size-4" />}
                      onClick={() => i.status === "new" && update(i, "read")}
                    >
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    href={`tel:${i.phone}`}
                    leadingIcon={<Phone className="size-4" />}
                  >
                    Call
                  </Button>
                  {i.email && (
                    <Button
                      size="sm"
                      variant="ghost"
                      href={`mailto:${i.email}`}
                      leadingIcon={<Mail className="size-4" />}
                    >
                      Email
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
