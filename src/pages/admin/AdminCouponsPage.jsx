import { lazy, Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Select } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { formatDate, formatPrice } from "../../lib/format";
import { notify } from "../../lib/notify";
import { useForm } from "../../lib/use-form";
import { adminKeys, createCoupon, deleteCoupon, fetchCoupons } from "../../features/admin/api";
import { AdminHeader, EmptyRow, Panel, Table, Toggle } from "../../features/admin/ui";
import { adminQuery, td, th } from "../../features/admin/format";

const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

const blank = () => ({
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  expiresAt: "",
  maxUses: "",
});

function validate(v) {
  const e = {};
  if (!/^[A-Z0-9_-]{3,30}$/.test(v.code.trim().toUpperCase()))
    e.code = "3–30 letters, numbers, - or _";
  const value = Number(v.discountValue);
  if (!(value >= 1)) e.discountValue = "At least 1";
  else if (v.discountType === "percentage" && value > 90) e.discountValue = "90% at most";
  for (const f of ["minOrderAmount", "maxDiscountAmount", "maxUses"])
    if (v[f] !== "" && !(Number(v[f]) >= 0)) e[f] = "0 or more";
  if (v.expiresAt && new Date(v.expiresAt) <= new Date()) e.expiresAt = "Pick a future date";
  return e;
}

const describe = (c) =>
  c.discountType === "percentage"
    ? `${c.discountValue}% off${c.maxDiscountAmount ? `, up to ${formatPrice(c.maxDiscountAmount)}` : ""}`
    : `${formatPrice(c.discountValue)} off`;

/** /admin/coupons — create and delete codes (the backend has no edit). */
export default function CouponsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: adminKeys.coupons,
    queryFn: ({ signal }) => fetchCoupons({ signal }),
    ...adminQuery,
  });
  const form = useForm(blank);
  const [active, setActive] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(/** @type {any} */ (null));

  const onValid = async (v) => {
    setPending(true);
    setError("");
    try {
      await createCoupon({
        code: v.code.trim().toUpperCase(),
        discountType: v.discountType,
        discountValue: Number(v.discountValue),
        ...(v.minOrderAmount ? { minOrderAmount: Number(v.minOrderAmount) } : {}),
        ...(v.maxDiscountAmount ? { maxDiscountAmount: Number(v.maxDiscountAmount) } : {}),
        ...(v.maxUses ? { maxUses: Number(v.maxUses) } : {}),
        ...(v.expiresAt ? { expiresAt: new Date(`${v.expiresAt}T23:59:59`).toISOString() } : {}),
        isActive: active,
      });
      notify.success(`Coupon ${v.code.trim().toUpperCase()} created`);
      Object.entries(blank()).forEach(([k, val]) => form.set(k, val));
      queryClient.invalidateQueries({ queryKey: adminKeys.coupons });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      await deleteCoupon(removing._id);
      notify.success(`Deleted ${removing.code}`);
      setRemoving(null);
      queryClient.invalidateQueries({ queryKey: adminKeys.coupons });
    } catch (err) {
      notify.error(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <AdminHeader
        title="Coupons"
        description="Codes can't be edited — delete one and create it again to change it."
      />

      <Panel title="New coupon">
        <form
          onSubmit={(e) => form.handleSubmit(validate, onValid)(e)}
          noValidate
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="Code" required error={form.errors.code}>
            {(f) => (
              <Input
                {...f}
                {...form.field("code")}
                autoCapitalize="characters"
                placeholder="EID20"
              />
            )}
          </Field>
          <Field label="Type">
            {(f) => (
              <Select {...f} {...form.field("discountType")}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount (Rs)</option>
              </Select>
            )}
          </Field>
          <Field
            label={form.values.discountType === "percentage" ? "Percent off" : "Rupees off"}
            required
            error={form.errors.discountValue}
          >
            {(f) => (
              <Input
                {...f}
                {...form.field("discountValue")}
                type="number"
                inputMode="numeric"
                min={1}
              />
            )}
          </Field>
          <Field label="Minimum order (Rs)" hint="Optional" error={form.errors.minOrderAmount}>
            {(f) => (
              <Input
                {...f}
                {...form.field("minOrderAmount")}
                type="number"
                inputMode="numeric"
                min={0}
              />
            )}
          </Field>
          <Field
            label="Maximum discount (Rs)"
            hint="Optional cap"
            error={form.errors.maxDiscountAmount}
          >
            {(f) => (
              <Input
                {...f}
                {...form.field("maxDiscountAmount")}
                type="number"
                inputMode="numeric"
                min={0}
              />
            )}
          </Field>
          <Field label="Total uses allowed" hint="Optional" error={form.errors.maxUses}>
            {(f) => (
              <Input {...f} {...form.field("maxUses")} type="number" inputMode="numeric" min={0} />
            )}
          </Field>
          <Field label="Expires on" hint="Optional (end of that day)" error={form.errors.expiresAt}>
            {(f) => <Input {...f} {...form.field("expiresAt")} type="date" />}
          </Field>
          <div className="flex items-end pb-3">
            <Toggle checked={active} onChange={setActive} label="Active now" />
          </div>
          {error && (
            <p role="alert" className="text-small text-danger sm:col-span-2 lg:col-span-4">
              {error}
            </p>
          )}
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" loading={pending}>
              Create coupon
            </Button>
          </div>
        </form>
      </Panel>

      <div className="mt-6">
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton className="h-48" />
        ) : (
          <Table label="Coupons">
            <thead>
              <tr>
                <th className={th}>Code</th>
                <th className={th}>Discount</th>
                <th className={th}>Rules</th>
                <th className={th}>Used</th>
                <th className={th}>Status</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.data.length === 0 && <EmptyRow colSpan={6}>No coupons yet.</EmptyRow>}
              {query.data.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const usedUp = c.maxUses && c.usedCount >= c.maxUses;
                const state = !c.isActive
                  ? "Off"
                  : expired
                    ? "Expired"
                    : usedUp
                      ? "Used up"
                      : "Active";
                return (
                  <tr key={c._id}>
                    <td className={`${td} font-mono font-semibold`}>{c.code}</td>
                    <td className={td}>{describe(c)}</td>
                    <td className={`${td} text-ink-2`}>
                      {c.minOrderAmount
                        ? `Orders over ${formatPrice(c.minOrderAmount)}`
                        : "Any order"}
                      {c.expiresAt && (
                        <span className="block">Until {formatDate(c.expiresAt)}</span>
                      )}
                    </td>
                    <td className={`${td} tabular-nums`}>
                      {c.usedCount ?? 0}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className={`${td} ${state === "Active" ? "text-success" : "text-ink-3"}`}>
                      {state}
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        className="text-danger underline"
                        onClick={() => setRemoving(c)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      {removing && (
        <Suspense fallback={null}>
          <ConfirmDialog
            open
            onOpenChange={(o) => !o && setRemoving(null)}
            title={`Delete coupon ${removing.code}?`}
            description="Shoppers who still have the code won't be able to use it. This can't be undone."
            confirmLabel="Delete coupon"
            pending={pending}
            onConfirm={remove}
          />
        </Suspense>
      )}
    </div>
  );
}
