import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { notify } from "../../lib/notify";
import { adminKeys, fetchPromoPopup, savePromoPopup, uploadImage } from "../../features/admin/api";
import { adminQuery } from "../../features/admin/format";
import { Choice, NumberField } from "../../features/admin/fields";
import { AdminHeader, Panel, Toggle } from "../../features/admin/ui";
import { PromoCard } from "../../features/promo/PromoCard";

const DEFAULTS = {
  enabled: false,
  layout: "image_text",
  image: { url: "", publicId: "" },
  eyebrow: "",
  title: "",
  message: "",
  ctaLabel: "",
  ctaTarget: "register",
  ctaUrl: "",
  delaySeconds: 8,
  staySeconds: 0,
  repeatDays: 3,
  audience: "guests",
  pages: "all",
  startsAt: "",
  endsAt: "",
};

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

/**
 * Admin → Promo popup: the message that pops up on the store after a few seconds (an offer,
 * a sign-up nudge, an announcement). Content, timing and audience, with a live preview that
 * uses the storefront's own popup card.
 */
export default function AdminPromoPage() {
  const query = useQuery({
    queryKey: adminKeys.promo,
    queryFn: ({ signal }) => fetchPromoPopup({ signal }),
    ...adminQuery,
  });
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (query.isPending) return <Skeleton className="h-96 max-w-6xl" />;
  // A new saved version re-creates the form from what was saved (and clears "unsaved").
  return <PromoForm key={query.data?.version ?? 0} saved={query.data} />;
}

/** The saved popup as form values (dates as yyyy-mm-dd for the date inputs). */
function fromSaved(saved) {
  const d = saved ?? {};
  return {
    ...DEFAULTS,
    ...d,
    image: d.image?.url ? d.image : DEFAULTS.image,
    startsAt: toDateInput(d.startsAt),
    endsAt: toDateInput(d.endsAt),
  };
}

function PromoForm({ saved }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => fromSaved(saved));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const onImage = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { image } = await uploadImage(file);
      set({ image });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const save = async (patch = {}) => {
    setSaving(true);
    setError("");
    const body = { ...draft, ...patch };
    try {
      const saved = await savePromoPopup({
        ...body,
        delaySeconds: Number(body.delaySeconds) || 0,
        staySeconds: Number(body.staySeconds) || 0,
        repeatDays: Number(body.repeatDays) || 0,
        startsAt: body.startsAt || null,
        endsAt: body.endsAt || null,
      });
      queryClient.setQueryData(adminKeys.promo, saved);
      notify.success(body.enabled ? "Popup saved — it's live on the store" : "Popup saved");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const needsImage = draft.layout !== "text";
  const needsText = draft.layout !== "image";
  const problems = [
    needsImage && !draft.image?.url && "Add an image",
    needsText && !draft.title.trim() && "Add a headline",
  ].filter(Boolean);

  return (
    <div className="max-w-6xl">
      <AdminHeader
        title="Promo popup"
        description="A message that pops up on the store after a few seconds — an offer, a sign-up nudge or an announcement."
        actions={
          <Toggle
            checked={draft.enabled}
            onChange={(enabled) => {
              set({ enabled });
              save({ enabled });
            }}
            label={draft.enabled ? "Live on the store" : "Off"}
            disabled={saving || (!draft.enabled && problems.length > 0)}
          />
        }
      />
      {!draft.enabled && problems.length > 0 && (
        <p className="-mt-3 mb-5 text-small text-ink-3">To switch it on: {problems.join(" · ")}.</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_380px]">
        <Panel title="Content">
          <div className="flex flex-col gap-4">
            <Choice
              label="Style"
              value={draft.layout}
              onChange={(layout) => set({ layout })}
              options={[
                ["image_text", "Image + text"],
                ["image", "Image only"],
                ["text", "Text only"],
              ]}
            />
            {needsImage && (
              <div className="flex flex-col gap-1.5">
                <span className="text-small font-medium">Image</span>
                {draft.image?.url ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={draft.image.url}
                      alt=""
                      className="size-20 rounded-md border border-line object-cover"
                    />
                    <label className="cursor-pointer text-small font-semibold underline">
                      Replace
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(e) => onImage(e.target.files?.[0])}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => set({ image: DEFAULTS.image })}
                      className="inline-flex items-center gap-1 text-small text-danger underline"
                    >
                      <Trash2 aria-hidden="true" className="size-4" /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-1 rounded-md border-[1.5px] border-dashed border-line-strong px-4 py-6 text-center text-small text-ink-3 hover:border-ink-3">
                    <ImagePlus aria-hidden="true" className="size-6" />
                    {uploading ? "Uploading…" : "Choose an image"}
                    <span>JPG, PNG or WebP · square or portrait · up to 5 MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => onImage(e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            )}
            {needsText && (
              <>
                <Field label="Small label" hint="Optional, e.g. Members only">
                  {(f) => (
                    <Input
                      {...f}
                      maxLength={40}
                      value={draft.eyebrow}
                      onChange={(e) => set({ eyebrow: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Headline" required>
                  {(f) => (
                    <Input
                      {...f}
                      maxLength={90}
                      value={draft.title}
                      onChange={(e) => set({ title: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Message" hint="Optional · up to 300 characters">
                  {(f) => (
                    <Textarea
                      {...f}
                      rows={3}
                      maxLength={300}
                      value={draft.message}
                      onChange={(e) => set({ message: e.target.value })}
                    />
                  )}
                </Field>
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button text" hint="Leave empty for no button">
                {(f) => (
                  <Input
                    {...f}
                    maxLength={40}
                    value={draft.ctaLabel}
                    onChange={(e) => set({ ctaLabel: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Button goes to">
                {(f) => (
                  <Select
                    {...f}
                    value={draft.ctaTarget}
                    onChange={(e) => set({ ctaTarget: e.target.value })}
                  >
                    <option value="register">Sign-up page</option>
                    <option value="shop">Shop all</option>
                    <option value="custom">Custom link…</option>
                  </Select>
                )}
              </Field>
            </div>
            {draft.ctaTarget === "custom" && (
              <Field
                label="Link"
                hint="A store page like /category/protein, or a full https:// link"
              >
                {(f) => (
                  <Input
                    {...f}
                    value={draft.ctaUrl}
                    placeholder="/category/protein"
                    onChange={(e) => set({ ctaUrl: e.target.value })}
                  />
                )}
              </Field>
            )}
          </div>
        </Panel>

        <Panel title="When and where">
          <div className="flex flex-col gap-4">
            <NumberField
              label="Show after"
              unit="seconds on the site"
              min={0}
              max={120}
              value={draft.delaySeconds}
              onChange={(delaySeconds) => set({ delaySeconds })}
            />
            <NumberField
              label="Stays open for"
              hint="0 = until they close it"
              unit="seconds"
              min={0}
              max={300}
              value={draft.staySeconds}
              onChange={(staySeconds) => set({ staySeconds })}
            />
            <Choice
              label="How often"
              value={Number(draft.repeatDays) === 0 ? "every" : "days"}
              onChange={(v) => set({ repeatDays: v === "every" ? 0 : 3 })}
              options={[
                ["every", "Every time the site is opened or refreshed"],
                ["days", "Once, then again after some days"],
              ]}
            />
            {Number(draft.repeatDays) !== 0 && (
              <NumberField
                label="After it's closed, show again in"
                unit="days"
                min={1}
                max={365}
                value={draft.repeatDays}
                onChange={(repeatDays) => set({ repeatDays })}
              />
            )}
            <Choice
              label="Who sees it"
              value={draft.audience}
              onChange={(audience) => set({ audience })}
              options={[
                ["guests", "Only guests (not logged in)"],
                ["everyone", "Everyone"],
              ]}
            />
            <Choice
              label="Pages"
              value={draft.pages}
              onChange={(pages) => set({ pages })}
              options={[
                ["all", "All store pages"],
                ["home", "Homepage only"],
              ]}
            />
            <p className="-mt-2 text-small text-ink-3">
              Never shown on checkout, account, login or admin pages.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts" hint="Optional">
                {(f) => (
                  <Input
                    {...f}
                    type="date"
                    value={draft.startsAt}
                    onChange={(e) => set({ startsAt: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Ends" hint="Optional">
                {(f) => (
                  <Input
                    {...f}
                    type="date"
                    value={draft.endsAt}
                    onChange={(e) => set({ endsAt: e.target.value })}
                  />
                )}
              </Field>
            </div>
            {error && (
              <p role="alert" className="text-small text-danger">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => save()} loading={saving} disabled={!dirty}>
                Save
              </Button>
              {saved?.enabled && (
                <Button href="/?promo-preview=1" target="_blank" rel="noopener" variant="outline">
                  See it on the store
                </Button>
              )}
            </div>
            {dirty && <p className="text-small text-ink-3">Unsaved changes.</p>}
          </div>
        </Panel>

        <section aria-label="Live preview" className="flex flex-col gap-2">
          <p className="label-caps text-ink-3">Live preview</p>
          <div className="rounded-band bg-ink/70 p-5">
            <div className="overflow-hidden rounded-band shadow-overlay">
              <PromoCard
                popup={draft}
                compact
                onAction={() => {}}
                onClose={() => {}}
                TitleTag="p"
              />
            </div>
          </div>
          <p className="text-small text-ink-3">
            Updates as you type. Create the coupon itself in Admin → Coupons.
          </p>
        </section>
      </div>
    </div>
  );
}
