import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import { Field } from "../../../components/ui/Field";
import { Input } from "../../../components/ui/Input";
import { errorMessage } from "../../../lib/api/errors";
import { notify } from "../../../lib/notify";
import { useForm } from "../../../lib/use-form";
import { canonicalCity } from "../../checkout/lib/pk-cities";
import { accountKeys, addAddress, updateAddress } from "../api";
import { addressBody, addressFormValues, validateAddress } from "../lib/address";
import { CityCombobox } from "../../checkout/components/CityCombobox";

/**
 * Add or edit a saved address. Loaded on demand (the dialog code isn't needed until the
 * shopper opens it).
 *
 * @param {{ open: boolean, onOpenChange: (o: boolean) => void, address?: any }} props
 */
export default function AddressFormDialog({ open, onOpenChange, address }) {
  const queryClient = useQueryClient();
  const form = useForm(() => addressFormValues(address));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const editing = Boolean(address?._id);

  const onValid = async (values) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const body = addressBody(values);
      if (editing) await updateAddress(address._id, body);
      else await addAddress(body);
      await queryClient.invalidateQueries({ queryKey: accountKeys.addresses });
      notify.success(editing ? "Address updated" : "Address saved");
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title={editing ? "Edit address" : "Add an address"}
      size="md"
    >
      <form
        onSubmit={(event) => form.handleSubmit(validateAddress, onValid)(event)}
        noValidate
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="Full name" required error={form.errors.fullName}>
          {(f) => <Input {...f} {...form.field("fullName")} autoComplete="name" />}
        </Field>
        <Field label="Mobile number" required error={form.errors.phone}>
          {(f) => (
            <Input
              {...f}
              {...form.field("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
            />
          )}
        </Field>
        <Field
          className="sm:col-span-2"
          label="Address"
          required
          hint="House or flat number, street and area"
          error={form.errors.addressLine1}
        >
          {(f) => <Input {...f} {...form.field("addressLine1")} autoComplete="address-line1" />}
        </Field>
        <Field className="sm:col-span-2" label="Nearby landmark" hint="Optional">
          {(f) => <Input {...f} {...form.field("addressLine2")} autoComplete="address-line2" />}
        </Field>
        <Field label="City" required error={form.errors.city}>
          {(f) => (
            <CityCombobox
              {...f}
              {...form.field("city", {
                onBlur: (e) => form.set("city", canonicalCity(e.target.value)),
              })}
              onPick={(city) => form.set("city", city)}
            />
          )}
        </Field>
        <Field
          label="Postal code"
          hint="Optional — 5 digits, on any utility bill"
          error={form.errors.postalCode}
        >
          {(f) => (
            <Input
              {...f}
              {...form.field("postalCode")}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
            />
          )}
        </Field>

        {error && (
          <p
            role="alert"
            className="rounded-sm bg-danger-soft px-3 py-2 text-small text-danger sm:col-span-2"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {editing ? "Save changes" : "Save address"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
