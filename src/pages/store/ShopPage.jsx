import { Seo } from "../../components/seo/Seo";
import { ListingHeader } from "../../features/catalog/components/ListingHeader";
import { ListingView } from "../../features/catalog/components/ListingView";
import { activeFilterCount } from "../../features/catalog/lib/listing-params";
import { useListing } from "../../features/catalog/useListing";

/** /shop — every product, plus search results (?q=). */
export default function ShopPage() {
  const listing = useListing({ type: "shop" });
  const { q } = listing.state;
  // Search results and filtered views aren't separate pages for search engines.
  const noIndex = Boolean(q) || activeFilterCount(listing.state, {}) > 0;

  return (
    <>
      <Seo
        title={q ? `Search: ${q}` : "Shop all supplements"}
        description="Authentic whey protein, creatine, pre-workouts, mass gainers and more from 21 trusted brands. Cash on delivery across Pakistan."
        canonicalPath="/shop"
        noIndex={noIndex}
      />
      <ListingView
        listing={listing}
        header={
          <ListingHeader
            crumbs={[{ label: "Home", to: "/" }, { label: q ? "Search" : "Shop" }]}
            eyebrow={q ? "Search results" : "Authentic sports nutrition"}
            title={q ? `“${q}”` : "All products"}
          />
        }
      />
    </>
  );
}
