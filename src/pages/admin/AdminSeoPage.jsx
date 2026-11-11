import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Textarea } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { notify } from "../../lib/notify";
import { useForm } from "../../lib/use-form";
import { adminKeys, fetchSeoSettings, saveSeoSettings } from "../../features/admin/api";
import { ImageUpload } from "../../features/admin/components/ImageUpload";
import { AdminHeader, Panel } from "../../features/admin/ui";
import { adminQuery } from "../../features/admin/format";

const TEXT = [
  ["siteTitle", "Site title", 70],
  ["ogTitle", "Share title", 90],
];

function SeoForm({ settings }) {
  const queryClient = useQueryClient();
  const form = useForm(() => ({
    siteTitle: settings?.siteTitle ?? "",
    metaDescription: settings?.metaDescription ?? "",
    keywords: (settings?.keywords ?? []).join(", "),
    ogTitle: settings?.ogTitle ?? "",
    ogDescription: settings?.ogDescription ?? "",
    googleSiteVerification: settings?.googleSiteVerification ?? "",
    googleAnalyticsId: settings?.googleAnalyticsId ?? "",
  }));
  const [ogImage, setOgImage] = useState(settings?.ogImage ? { url: settings.ogImage } : null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const validate = (v) =>
    v.googleAnalyticsId && !/^G-[A-Z0-9]{4,}$/i.test(v.googleAnalyticsId.trim())
      ? { googleAnalyticsId: "Looks like G-XXXXXXX" }
      : {};

  const onValid = async (v) => {
    setPending(true);
    setError("");
    try {
      await saveSeoSettings({
        ...Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val.trim()])),
        keywords: v.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        ogImage: ogImage?.url ?? "",
      });
      notify.success("SEO settings saved");
      queryClient.invalidateQueries({ queryKey: adminKeys.seo });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={(e) => form.handleSubmit(validate, onValid)(e)}
      noValidate
      className="grid gap-4 md:grid-cols-2"
    >
      {TEXT.map(([f, label, max]) => (
        <Field key={f} label={label}>
          {(p) => <Input {...p} {...form.field(f)} maxLength={max} />}
        </Field>
      ))}
      <Field label="Meta description" hint="About 150 characters" className="md:col-span-2">
        {(p) => <Textarea {...p} {...form.field("metaDescription")} rows={2} maxLength={300} />}
      </Field>
      <Field label="Share description" className="md:col-span-2">
        {(p) => <Textarea {...p} {...form.field("ogDescription")} rows={2} maxLength={300} />}
      </Field>
      <Field label="Keywords" hint="Comma separated" className="md:col-span-2">
        {(p) => <Input {...p} {...form.field("keywords")} />}
      </Field>
      <Field label="Google site verification code">
        {(p) => <Input {...p} {...form.field("googleSiteVerification")} />}
      </Field>
      <Field label="Google Analytics ID" error={form.errors.googleAnalyticsId}>
        {(p) => <Input {...p} {...form.field("googleAnalyticsId")} placeholder="G-XXXXXXX" />}
      </Field>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <span className="text-small font-medium">Share image (1200 × 630)</span>
        <ImageUpload label="Share image" value={ogImage} onChange={setOgImage} />
      </div>
      {error && (
        <p role="alert" className="text-small text-danger md:col-span-2">
          {error}
        </p>
      )}
      <div className="md:col-span-2">
        <Button type="submit" loading={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}

/** /admin/seo — site-wide search and sharing defaults kept by the backend. */
export default function SeoPage() {
  const query = useQuery({
    queryKey: adminKeys.seo,
    queryFn: ({ signal }) => fetchSeoSettings({ signal }),
    ...adminQuery,
  });
  return (
    <div className="max-w-4xl">
      <AdminHeader
        title="SEO"
        description="Site-wide defaults. Product, category and brand pages write their own titles and descriptions from their content."
      />
      <Panel>
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} compact />
        ) : query.isPending ? (
          <Skeleton className="h-80" />
        ) : (
          <SeoForm settings={query.data} />
        )}
      </Panel>
    </div>
  );
}
