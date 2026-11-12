import { lazy, Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { notify } from "../../lib/notify";
import { useForm } from "../../lib/use-form";
import { adminKeys, fetchMarketingStats, sendBroadcast } from "../../features/admin/api";
import { AdminHeader, Panel } from "../../features/admin/ui";
import { adminQuery, shortDateTime } from "../../features/admin/format";

const Dialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.Dialog })),
);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v, { test }) {
  const e = {};
  if (!v.subject.trim()) e.subject = "Write a subject line";
  else if (v.subject.length > 200) e.subject = "200 characters at most";
  const len = v.content.trim().length;
  if (len < 10) e.content = "Write the message (at least 10 characters)";
  if (len > 15000) e.content = "15,000 characters at most";
  if (v.ctaLink.trim() && !/^https?:\/\/\S+$/.test(v.ctaLink.trim()))
    e.ctaLink = "A full link starting with https://";
  if (v.ctaLink.trim() && !v.ctaText.trim()) e.ctaText = "Button text for the link";
  if (test && !EMAIL.test(v.testEmail.trim())) e.testEmail = "Where should the test go?";
  return e;
}

/** What the email will roughly look like (blank line = new paragraph, as the backend does). */
function Preview({ v }) {
  return (
    <div className="rounded-sm border border-line bg-surface p-5 text-small">
      <p className="label-caps text-ink-3">Subject: {v.subject || "—"}</p>
      {v.headline && <p className="mt-3 text-h3 font-bold">{v.headline}</p>}
      <div className="mt-3 flex flex-col gap-3">
        {v.content
          .trim()
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
      </div>
      {v.discountCode && (
        <p className="mt-4 inline-block border border-dashed border-ink px-3 py-1.5 font-mono font-semibold">
          {v.discountCode}
        </p>
      )}
      {v.ctaText && v.ctaLink && (
        <p className="mt-4">
          <span className="inline-block rounded-md bg-brand px-4 py-2 font-semibold">
            {v.ctaText}
          </span>
        </p>
      )}
    </div>
  );
}

/** /admin/marketing — email registered customers (guests are never emailed). */
export default function MarketingPage() {
  const queryClient = useQueryClient();
  const stats = useQuery({
    queryKey: adminKeys.marketing,
    queryFn: ({ signal }) => fetchMarketingStats({ signal }),
    ...adminQuery,
  });
  const form = useForm(() => ({
    subject: "",
    headline: "",
    content: "",
    discountCode: "",
    ctaText: "",
    ctaLink: "",
    targetAudience: "all",
    testEmail: "",
  }));
  const [sending, setSending] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");

  const audience = {
    all: stats.data?.totalRegistered,
    verified: stats.data?.verifiedCount,
    buyers: stats.data?.buyersCount,
  }[form.values.targetAudience];

  const body = (v, testEmail) => ({
    subject: v.subject.trim(),
    content: v.content.trim(),
    ...(v.headline.trim() ? { headline: v.headline.trim() } : {}),
    ...(v.discountCode.trim() ? { discountCode: v.discountCode.trim().toUpperCase() } : {}),
    ...(v.ctaText.trim() && v.ctaLink.trim()
      ? { ctaText: v.ctaText.trim(), ctaLink: v.ctaLink.trim() }
      : {}),
    targetAudience: v.targetAudience,
    ...(testEmail ? { testEmail } : {}),
  });

  const sendTest = (e) =>
    form.handleSubmit(
      (v) => validate(v, { test: true }),
      async (v) => {
        setSending("test");
        setError("");
        try {
          await sendBroadcast(body(v, v.testEmail.trim()));
          notify.success(`Test sent to ${v.testEmail.trim()}`);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setSending("");
        }
      },
    )(e);

  const askToSend = (e) =>
    form.handleSubmit(
      (v) => validate(v, { test: false }),
      () => {
        setTyped("");
        setConfirm(true);
      },
    )(e);

  const sendAll = async () => {
    setSending("all");
    setError("");
    try {
      const res = await sendBroadcast(body(form.values));
      const r = res?.data ?? res;
      notify.success(
        `Sent to ${r?.sentCount ?? "all"} customers${r?.failedCount ? `, ${r.failedCount} failed` : ""}`,
      );
      setConfirm(false);
      queryClient.invalidateQueries({ queryKey: adminKeys.marketing });
    } catch (err) {
      setError(errorMessage(err));
      setConfirm(false);
    } finally {
      setSending("");
    }
  };

  return (
    <div className="max-w-5xl">
      <AdminHeader
        title="Marketing email"
        description="Goes to registered customers only. Send yourself a test first."
      />

      {stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => stats.refetch()} compact />
      ) : (
        <p className="mb-4 text-small text-ink-2">
          {stats.isPending
            ? "Counting customers…"
            : `${stats.data.totalRegistered} registered customers, ${stats.data.verifiedCount} with a verified email, ${stats.data.buyersCount ?? 0} who have ordered.`}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Compose">
          <form onSubmit={askToSend} noValidate className="flex flex-col gap-4">
            <Field label="Subject" required error={form.errors.subject}>
              {(p) => <Input {...p} {...form.field("subject")} maxLength={200} />}
            </Field>
            <Field label="Headline" hint="Optional">
              {(p) => <Input {...p} {...form.field("headline")} />}
            </Field>
            <Field
              label="Message"
              required
              hint="A blank line starts a new paragraph"
              error={form.errors.content}
            >
              {(p) => <Textarea {...p} {...form.field("content")} rows={8} maxLength={15000} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discount code" hint="Optional">
                {(p) => (
                  <Input
                    {...p}
                    {...form.field("discountCode")}
                    maxLength={30}
                    autoCapitalize="characters"
                  />
                )}
              </Field>
              <Field label="Send to">
                {(p) => (
                  <Select {...p} {...form.field("targetAudience")}>
                    <option value="all">All registered customers</option>
                    <option value="verified">Verified emails only</option>
                    <option value="buyers">Customers who have ordered</option>
                  </Select>
                )}
              </Field>
              <Field label="Button text" hint="Optional" error={form.errors.ctaText}>
                {(p) => <Input {...p} {...form.field("ctaText")} placeholder="Shop now" />}
              </Field>
              <Field label="Button link" hint="Optional" error={form.errors.ctaLink}>
                {(p) => (
                  <Input
                    {...p}
                    {...form.field("ctaLink")}
                    type="url"
                    placeholder="https://www.adeebsupplement.pk/shop"
                  />
                )}
              </Field>
            </div>
            <div className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
              <Field label="Test email" error={form.errors.testEmail} className="min-w-56 flex-1">
                {(p) => <Input {...p} {...form.field("testEmail")} type="email" />}
              </Field>
              <Button variant="outline" onClick={sendTest} loading={sending === "test"}>
                Send test
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-small text-danger">
                {error}
              </p>
            )}
            <Button type="submit" disabled={!audience} loading={sending === "all"}>
              Send to {audience ?? "…"} customers
            </Button>
          </form>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Preview">
            <Preview v={form.values} />
          </Panel>
          <Panel title="Recent campaigns">
            {stats.isPending ? (
              <Skeleton className="h-24" />
            ) : stats.data?.recentCampaigns?.length ? (
              <ul className="flex flex-col divide-y divide-line text-small">
                {stats.data.recentCampaigns.map((c) => (
                  <li key={c._id} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0 truncate">{c.subject}</span>
                    <span className="shrink-0 text-ink-3">
                      {c.sentCount ?? 0} sent · {shortDateTime(c.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-ink-3">No campaigns yet.</p>
            )}
          </Panel>
        </div>
      </div>

      {confirm && (
        <Suspense fallback={null}>
          <Dialog
            open
            onOpenChange={(o) => !o && sending !== "all" && setConfirm(false)}
            title={`Email ${audience} customers?`}
            description="This can't be stopped once it starts, and it may take a few minutes. Keep this tab open."
          >
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-small font-medium">
                Type SEND to confirm
                <Input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirm(false)}
                  disabled={sending === "all"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendAll}
                  disabled={typed.trim().toUpperCase() !== "SEND"}
                  loading={sending === "all"}
                >
                  Send now
                </Button>
              </div>
            </div>
          </Dialog>
        </Suspense>
      )}
    </div>
  );
}
