import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrandIcon } from "../../components/ui/BrandIcons";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Textarea } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { WhatsAppGreeting } from "../../components/layout/FloatingWhatsApp";
import { WHATSAPP_DEFAULTS } from "../../components/layout/whatsapp-defaults";
import { site, whatsappLink } from "../../config/site";
import { errorMessage } from "../../lib/api/errors";
import { formatPkPhone } from "../../lib/format";
import { notify } from "../../lib/notify";
import { adminKeys, fetchWhatsAppWidget, saveWhatsAppWidget } from "../../features/admin/api";
import { Choice, NumberField } from "../../features/admin/fields";
import { adminQuery } from "../../features/admin/format";
import { AdminHeader, Panel, Toggle } from "../../features/admin/ui";

/**
 * Admin → WhatsApp button: the floating button on every store page and the greeting that pops
 * out beside it — on/off, words, timing, how often and where — with a live preview.
 */
export default function AdminWhatsAppPage() {
  const query = useQuery({
    queryKey: adminKeys.whatsapp,
    queryFn: ({ signal }) => fetchWhatsAppWidget({ signal }),
    ...adminQuery,
  });
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (query.isPending) return <Skeleton className="h-96 max-w-5xl" />;
  return <WhatsAppForm key={query.data?.version ?? 0} saved={query.data} />;
}

function WhatsAppForm({ saved }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => ({ ...WHATSAPP_DEFAULTS, ...saved }));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await saveWhatsAppWidget({
        ...draft,
        delaySeconds: Number(draft.delaySeconds) || 0,
        hideSeconds: Number(draft.hideSeconds) || 0,
      });
      queryClient.setQueryData(adminKeys.whatsapp, result);
      notify.success("WhatsApp button saved — live on the store within a minute");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <AdminHeader
        title="WhatsApp button"
        description={`The button at the bottom-right of every store page. It opens a WhatsApp chat with ${formatPkPhone(site.contact.whatsapp)}.`}
        actions={
          <Toggle
            checked={draft.enabled}
            onChange={(enabled) => set({ enabled })}
            label={draft.enabled ? "Button shown" : "Button hidden"}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Panel title="Greeting message">
            <div className="flex flex-col gap-4">
              <Toggle
                checked={draft.greetingEnabled}
                onChange={(greetingEnabled) => set({ greetingEnabled })}
                label="Show a greeting beside the button"
              />
              {draft.greetingEnabled && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name line" hint="Optional">
                      {(f) => (
                        <Input
                          {...f}
                          maxLength={40}
                          value={draft.greetingTitle}
                          onChange={(e) => set({ greetingTitle: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Link words" hint="Shown underlined at the end">
                      {(f) => (
                        <Input
                          {...f}
                          maxLength={30}
                          value={draft.linkText}
                          onChange={(e) => set({ linkText: e.target.value })}
                        />
                      )}
                    </Field>
                  </div>
                  <Field label="Message" required>
                    {(f) => (
                      <Textarea
                        {...f}
                        rows={2}
                        maxLength={120}
                        value={draft.greetingText}
                        onChange={(e) => set({ greetingText: e.target.value })}
                      />
                    )}
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      label="Appears after"
                      unit="seconds"
                      min={0}
                      max={60}
                      value={draft.delaySeconds}
                      onChange={(delaySeconds) => set({ delaySeconds })}
                    />
                    <NumberField
                      label="Disappears after"
                      hint="0 = stays until closed"
                      unit="seconds"
                      min={0}
                      max={120}
                      value={draft.hideSeconds}
                      onChange={(hideSeconds) => set({ hideSeconds })}
                    />
                  </div>
                  <Choice
                    label="How often"
                    value={draft.frequency}
                    onChange={(frequency) => set({ frequency })}
                    options={[
                      ["every_load", "Every time the site is opened or refreshed"],
                      ["once_per_visit", "Once per visit"],
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
                </>
              )}
            </div>
          </Panel>

          <Panel title="WhatsApp chat">
            <Field
              label="Message already typed when the chat opens"
              hint="The shopper can change it before sending"
            >
              {(f) => (
                <Textarea
                  {...f}
                  rows={2}
                  maxLength={200}
                  value={draft.chatMessage}
                  onChange={(e) => set({ chatMessage: e.target.value })}
                />
              )}
            </Field>
          </Panel>

          {error && (
            <p role="alert" className="text-small text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={save} loading={saving} disabled={!dirty}>
              Save
            </Button>
            {dirty && <span className="text-small text-ink-3">Unsaved changes</span>}
          </div>
        </div>

        <section aria-label="Live preview" className="flex flex-col gap-2">
          <p className="label-caps text-ink-3">Live preview</p>
          <div className="flex min-h-56 items-end justify-end gap-3 rounded-band bg-shelf p-5">
            {draft.enabled ? (
              <>
                {draft.greetingEnabled && draft.greetingText && (
                  <WhatsAppGreeting settings={draft} href={whatsappLink(draft.chatMessage)} />
                )}
                <span className="relative flex size-[54px] flex-none items-center justify-center rounded-2xl bg-ink text-white shadow-[0_14px_30px_-12px_rgb(0_0_0/0.55)]">
                  <BrandIcon name="WhatsApp" className="size-[26px]" />
                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-2 size-2.5 rounded-full bg-[#25d366] ring-2 ring-ink"
                  />
                </span>
              </>
            ) : (
              <p className="self-center text-small text-ink-3">
                The button is hidden on the store.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
