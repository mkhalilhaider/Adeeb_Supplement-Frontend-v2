import { Banknote, Store, Truck } from "lucide-react";
import { site } from "../../../config/site";
import { formatPrice } from "../../../lib/format";
import { useDeliveryFees } from "../../delivery/queries";

const fee = (amount) => (amount > 0 ? formatPrice(amount) : "Free");

/**
 * Delivery facts under the buy button. Fees come from the backend (the store sets them);
 * while they load or if they fail, the line still shows the facts that don't depend on them.
 */
export function DeliveryInfo() {
  const { fees } = useDeliveryFees();

  return (
    <ul className="flex flex-col gap-3 border-y border-line py-4 text-small">
      <li className="flex gap-3">
        <Truck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-2" />
        <span>
          <span className="font-semibold">Delivery across Pakistan.</span>{" "}
          {fees ? (
            <span className="text-ink-2">
              Karachi {fee(fees.karachi)} · Other cities {fee(fees.other)}
              {fees.freeThreshold > 0 && ` · Free over ${formatPrice(fees.freeThreshold)}`}
            </span>
          ) : (
            <span className="text-ink-2">Fee shown at checkout.</span>
          )}
        </span>
      </li>
      <li className="flex gap-3">
        <Banknote aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-2" />
        <span>
          <span className="font-semibold">Cash on delivery.</span>{" "}
          <span className="text-ink-2">Pay when your order arrives.</span>
        </span>
      </li>
      <li className="flex gap-3">
        <Store aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-2" />
        <span>
          <span className="font-semibold">Visit our store.</span>{" "}
          <a
            href={site.store.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-ink-2 underline underline-offset-2 hover:text-ink"
          >
            {site.store.area}
          </a>
        </span>
      </li>
    </ul>
  );
}
