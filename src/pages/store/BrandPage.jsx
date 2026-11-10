import { useParams } from "react-router";
import { Seo } from "../../components/seo/Seo";
import { ListingHeader } from "../../features/catalog/components/ListingHeader";
import { ListingView } from "../../features/catalog/components/ListingView";
import { activeFilterCount } from "../../features/catalog/lib/listing-params";
import { useListing } from "../../features/catalog/useListing";
import NotFoundPage from "./NotFoundPage";

/** /brand/:slug — one brand, optionally narrowed by category/price. */
export default function BrandPage() {
  const { slug } = useParams();
  const listing = useListing({ type: "brand", slug });
  if (listing.notFound) return <NotFoundPage />;

  const brand = listing.brand;
  const name = brand?.name ?? "";

  return (
    <>
      {brand && (
        <Seo
          title={`${name} supplements in Pakistan`}
          description={
            brand.description ||
            `Shop authentic ${name} supplements at Adeeb Supplement. Cash on delivery across Pakistan.`
          }
          canonicalPath={`/brand/${slug}`}
          noIndex={activeFilterCount(listing.state, listing.base) > 0 || Boolean(listing.state.q)}
        />
      )}
      <ListingView
        listing={listing}
        header={
          <ListingHeader
            crumbs={[
              { label: "Home", to: "/" },
              { label: "Brands", to: "/brands" },
              { label: name || "…" },
            ]}
            eyebrow="Brand"
            title={name || " "}
            description={brand?.description}
            logo={brand?.logoUrl}
          />
        }
      />
    </>
  );
}
