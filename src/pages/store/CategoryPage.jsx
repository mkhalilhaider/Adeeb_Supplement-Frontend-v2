import { useParams } from "react-router";
import { env } from "../../config/env";
import { Seo } from "../../components/seo/Seo";
import { ListingHeader } from "../../features/catalog/components/ListingHeader";
import { ListingView } from "../../features/catalog/components/ListingView";
import { activeFilterCount } from "../../features/catalog/lib/listing-params";
import { useListing } from "../../features/catalog/useListing";
import NotFoundPage from "./NotFoundPage";

/** /category/:slug — one category, optionally narrowed by brand/price. */
export default function CategoryPage() {
  const { slug } = useParams();
  const listing = useListing({ type: "category", slug });
  if (listing.notFound) return <NotFoundPage />;

  const category = listing.category;
  const name = category?.name ?? "";

  return (
    <>
      {category && (
        <Seo
          title={`${name} in Pakistan`}
          description={
            category.description ||
            `Shop authentic ${name.toLowerCase()} from trusted brands. Cash on delivery across Pakistan.`
          }
          canonicalPath={`/category/${slug}`}
          noIndex={activeFilterCount(listing.state, listing.base) > 0 || Boolean(listing.state.q)}
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Shop", item: `${env.siteUrl}/shop` },
              { "@type": "ListItem", position: 2, name, item: `${env.siteUrl}/category/${slug}` },
            ],
          }}
        />
      )}
      <ListingView
        listing={listing}
        header={
          <ListingHeader
            crumbs={[
              { label: "Home", to: "/" },
              { label: "Shop", to: "/shop" },
              { label: name || "…" },
            ]}
            eyebrow="Category"
            title={name || " "}
            description={category?.description}
            image={category?.imageUrl}
          />
        }
      />
    </>
  );
}
