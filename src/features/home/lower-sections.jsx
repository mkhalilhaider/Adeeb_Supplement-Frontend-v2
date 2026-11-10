import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CloudImage } from "../../components/ui/CloudImage";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { site, whatsappLink } from "../../config/site";
import { useTaxonomy } from "../catalog/useTaxonomy";
import { fetchStorefrontStats } from "./api";

/** Every brand logo, linking to the brand page. */
export function BrandsGrid() {
  const { brands } = useTaxonomy();
  if (!brands.length) return null;
  return (
    <section aria-labelledby="brands-heading">
      <SectionHeading
        id="brands-heading"
        eyebrow="Authentic brands only"
        title={`${brands.length} brands we stock`}
        action={{ label: "All brands", to: "/brands" }}
      />
      <ul className="mt-6 grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-4 lg:grid-cols-7">
        {brands.map((b) => (
          <li key={b._id} className="bg-surface">
            <Link
              to={`/brand/${b.slug}`}
              className="flex aspect-[3/2] items-center justify-center p-4 transition-colors duration-(--duration-fast) hover:bg-shelf"
              aria-label={b.name}
            >
              {b.logoUrl ? (
                <CloudImage
                  src={b.logoUrl}
                  alt=""
                  ratio={null}
                  fit="contain"
                  trim
                  blend
                  sizes="140px"
                  className="h-full w-full"
                />
              ) : (
                <span className="text-center text-small font-semibold">{b.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STAT_FORMAT = new Intl.NumberFormat("en-PK");

/** Real counters from the backend; numbers that are still zero are left out. */
export function StatsBand() {
  const stats = useQuery({
    queryKey: ["storefront-stats"],
    queryFn: ({ signal }) => fetchStorefrontStats({ signal }),
    staleTime: 10 * 60_000,
  });
  const items = [
    { value: stats.data?.orders, label: "Orders placed" },
    { value: stats.data?.deliveredParcels, label: "Parcels delivered" },
    { value: stats.data?.customers, label: "Customers served" },
    { value: stats.data?.repeatedCustomers, label: "Came back for more" },
  ].filter((i) => i.value > 0);
  if (!items.length) return null;
  return (
    <section aria-label="Adeeb Supplement in numbers" className="bg-night text-paper">
      <dl className="page-container grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4 md:py-14">
        {items.map((i) => (
          <div key={i.label} className="flex flex-col-reverse gap-1">
            <dt className="label-mono text-night-muted">{i.label}</dt>
            <dd className="text-[40px] leading-none font-extrabold font-condensed tabular-nums md:text-[56px]">
              {STAT_FORMAT.format(i.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The walk-in store: address, map, call and WhatsApp. */
export function StoreBand() {
  return (
    <section aria-labelledby="store-heading" className="page-container">
      <div className="grid gap-6 border border-line bg-surface p-6 md:grid-cols-[1fr_auto] md:items-end md:p-10">
        <div>
          <p className="label-mono text-ink-3">{site.store.label}</p>
          <h2
            id="store-heading"
            className="mt-2 text-h2 font-extrabold uppercase font-condensed md:text-[2rem]"
          >
            Visit us in Karachi
          </h2>
          <p className="mt-3 flex max-w-[52ch] items-start gap-2 text-ink-2">
            <MapPin aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-ink" />
            {site.store.address}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          <Button
            href={site.store.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            leadingIcon={<MapPin className="size-4" />}
          >
            Directions
          </Button>
          <Button
            href={`tel:${site.contact.phoneIntl}`}
            variant="outline"
            leadingIcon={<Phone className="size-4" />}
          >
            {site.contact.phoneDisplay}
          </Button>
          <Button
            href={whatsappLink("Hi Adeeb Supplement, I have a question.")}
            target="_blank"
            rel="noopener noreferrer"
            leadingIcon={<MessageCircle className="size-4" />}
          >
            WhatsApp us
          </Button>
        </div>
      </div>
    </section>
  );
}
