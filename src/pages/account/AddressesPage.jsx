import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { formatPkPhone } from "../../lib/format";
import { notify } from "../../lib/notify";
import { accountKeys, deleteAddress, updateAddress } from "../../features/account/api";
import { useAddresses } from "../../features/account/queries";

const AddressFormDialog = lazy(() => import("../../features/account/components/AddressFormDialog"));
const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

/** /account/addresses — saved delivery addresses: add, edit, make default, delete. */
export default function AddressesPage() {
  const queryClient = useQueryClient();
  const addresses = useAddresses();
  /** null = closed, {} = new address, address = editing */
  const [editing, setEditing] = useState(/** @type {any} */ (null));
  const [removing, setRemoving] = useState(/** @type {any} */ (null));
  const [busy, setBusy] = useState("");
  const headingRef = useRef(/** @type {HTMLHeadingElement|null} */ (null));

  // A closed dialog can't hand focus back when its button is gone (first address saved, or the
  // address deleted): keep keyboard focus on the page instead of <body>.
  useEffect(() => {
    if (editing || removing) return undefined;
    const id = setTimeout(() => {
      if (document.activeElement === document.body) headingRef.current?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [editing, removing]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses });

  const makeDefault = async (address) => {
    setBusy(address._id);
    try {
      await updateAddress(address._id, { isDefault: true });
      await refresh();
      notify.success("Default address updated");
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy("");
    }
  };

  const confirmRemove = async () => {
    setBusy(removing._id);
    try {
      await deleteAddress(removing._id);
      // Backend quirk: deleting the default of two addresses doesn't promote the other one.
      // Make the first remaining address the default so checkout still preselects one.
      if (removing.isDefault) {
        const remaining = (addresses.data ?? []).filter((a) => a._id !== removing._id);
        if (remaining.length > 0) await updateAddress(remaining[0]._id, { isDefault: true });
      }
      await refresh();
      notify.success("Address deleted");
      setRemoving(null);
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy("");
    }
  };

  const list = addresses.data ?? [];
  let body;
  if (addresses.isPending) {
    body = (
      <div role="status" className="grid gap-3 sm:grid-cols-2">
        <span className="sr-only">Loading addresses</span>
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  } else if (addresses.isError) {
    body = <ErrorState error={addresses.error} onRetry={() => addresses.refetch()} />;
  } else if (list.length === 0) {
    body = (
      <EmptyState
        icon={MapPin}
        title="No saved addresses"
        description="Save an address and pick it at checkout in one tap."
        action={<Button onClick={() => setEditing({})}>Add address</Button>}
      />
    );
  } else {
    body = (
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((a) => (
          <li
            key={a._id}
            className="flex flex-col gap-3 rounded-sm border border-line bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{a.fullName}</p>
              {a.isDefault && <Badge tone="success">Default</Badge>}
            </div>
            <address className="text-small text-ink-2 not-italic">
              <span className="block">{a.addressLine1}</span>
              {a.addressLine2 && <span className="block">{a.addressLine2}</span>}
              <span className="block">
                {a.city} {a.postalCode}
              </span>
              <span className="block">{formatPkPhone(a.phone)}</span>
            </address>
            <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-small font-medium">
              <button type="button" className="underline" onClick={() => setEditing(a)}>
                Edit<span className="sr-only"> address for {a.fullName}</span>
              </button>
              {!a.isDefault && (
                <button
                  type="button"
                  className="underline disabled:opacity-50"
                  disabled={busy === a._id}
                  onClick={() => makeDefault(a)}
                >
                  Make default<span className="sr-only"> ({a.addressLine1})</span>
                </button>
              )}
              <button
                type="button"
                className="text-danger underline"
                onClick={() => setRemoving(a)}
              >
                Delete<span className="sr-only"> address {a.addressLine1}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Seo title="My addresses" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-h2 font-extrabold uppercase font-condensed outline-none"
        >
          Addresses
        </h1>
        {list.length > 0 && (
          <Button
            variant="outline"
            leadingIcon={<Plus className="size-4" />}
            onClick={() => setEditing({})}
          >
            Add address
          </Button>
        )}
      </div>
      {body}

      <Suspense fallback={null}>
        {editing && (
          <AddressFormDialog
            key={editing._id ?? "new"}
            open
            onOpenChange={(open) => !open && setEditing(null)}
            address={editing._id ? editing : null}
          />
        )}
        {removing && (
          <ConfirmDialog
            open
            onOpenChange={(open) => !open && setRemoving(null)}
            title="Delete this address?"
            description={`${removing.fullName}, ${removing.addressLine1}, ${removing.city}`}
            confirmLabel="Delete address"
            pending={busy === removing._id}
            onConfirm={confirmRemove}
          />
        )}
      </Suspense>
    </div>
  );
}
