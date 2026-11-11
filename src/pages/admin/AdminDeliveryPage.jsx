import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { formatPrice } from "../../lib/format";
import { notify } from "../../lib/notify";
import { useForm } from "../../lib/use-form";
import { adminKeys, fetchDeliverySettings, saveDeliverySettings } from "../../features/admin/api";
import { AdminHeader, Panel } from "../../features/admin/ui";
import { adminQuery } from "../../features/admin/format";

const FIELDS = [
  ["karachiFee", "Karachi delivery fee (Rs)", "Local rider"],
  ["otherCitiesFee", "Other cities fee (Rs)", "Courier"],
  [
    "freeDeliveryThreshold",
    "Free delivery from (Rs)",
    "Order subtotal before coupons. 0 = never free.",
  ],
];

function validate(v) {
  const e = {};
  for (const [f] of FIELDS) {
    const n = Number(v[f]);
    if (v[f] === "" || !Number.isFinite(n) || n < 0) e[f] = "0 or more";
  }
  return e;
}

function DeliveryForm({ settings }) {
  const queryClient = useQueryClient();
  const form = useForm(() =>
    Object.fromEntries(FIELDS.map(([f]) => [f, String(settings?.[f] ?? 0)])),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const onValid = async (v) => {
    setPending(true);
    setError("");
    try {
      await saveDeliverySettings(Object.fromEntries(FIELDS.map(([f]) => [f, Number(v[f])])));
      notify.success("Delivery fees saved");
      queryClient.invalidateQueries({ queryKey: adminKeys.delivery });
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const k = Number(form.values.karachiFee);
  const o = Number(form.values.otherCitiesFee);
  const t = Number(form.values.freeDeliveryThreshold);
  return (
    <form
      onSubmit={(e) => form.handleSubmit(validate, onValid)(e)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map(([f, label, hint]) => (
          <Field key={f} label={label} hint={hint} error={form.errors[f]}>
            {(p) => <Input {...p} {...form.field(f)} type="number" inputMode="numeric" min={0} />}
          </Field>
        ))}
      </div>
      <p className="rounded-sm bg-shelf p-3 text-small">
        Shoppers will see: Karachi {Number.isFinite(k) ? formatPrice(k) : "—"}, other cities{" "}
        {Number.isFinite(o) ? formatPrice(o) : "—"}
        {t > 0 ? `, free on orders of ${formatPrice(t)} or more` : ", never free"}.
      </p>
      {(k > 5000 || o > 5000 || t > 200000) && (
        <p role="alert" className="rounded-sm bg-warning-soft p-3 text-small text-warning">
          These numbers look unusually high — please double-check before saving.
        </p>
      )}
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" loading={pending}>
          Save fees
        </Button>
      </div>
    </form>
  );
}

/** /admin/delivery — the three numbers every delivery quote comes from. */
export default function DeliveryPage() {
  const query = useQuery({
    queryKey: adminKeys.delivery,
    queryFn: ({ signal }) => fetchDeliverySettings({ signal }),
    ...adminQuery,
  });
  return (
    <div className="max-w-3xl">
      <AdminHeader
        title="Delivery fees"
        description="Checkout and the cart estimate use these immediately."
      />
      <Panel>
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} compact />
        ) : query.isPending ? (
          <Skeleton className="h-40" />
        ) : (
          <DeliveryForm settings={query.data} />
        )}
      </Panel>
    </div>
  );
}
