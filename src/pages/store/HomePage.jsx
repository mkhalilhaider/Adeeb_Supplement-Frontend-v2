import { lazy } from "react";
import { Seo } from "../../components/seo/Seo";
import { env } from "../../config/env";
import { site } from "../../config/site";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { Hero } from "../../features/home/Hero";
import { CategoryChips, CategoryTiles, QueryRail } from "../../features/home/sections";
import { WhenNear } from "../../features/home/WhenNear";

const ReelsSection = lazy(() => import("../../features/home/ReelsSection"));
const GoogleReviewsSection = lazy(() => import("../../features/home/GoogleReviewsSection"));
// Lower sections: their code loads as the shopper scrolls toward them.
const lower = () => import("../../features/home/lower-sections");
const BrandsGrid = lazy(() => lower().then((m) => ({ default: m.BrandsGrid })));
const StatsBand = lazy(() => lower().then((m) => ({ default: m.StatsBand })));
const StoreBand = lazy(() => lower().then((m) => ({ default: m.StoreBand })));

/** The store as a business (search engines: address, phone, hours-free LocalBusiness). */
const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: site.name,
  url: env.siteUrl,
  telephone: site.contact.phoneIntl,
  email: site.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.store.address,
    addressLocality: site.store.city,
    addressCountry: "PK",
  },
  sameAs: Object.values(site.social),
};

/**
 * Homepage. At load it needs one request (best sellers); the hero is static. Everything else
 * — more rails, videos, Google reviews, numbers — loads as the shopper scrolls near it.
 */
export default function HomePage() {
  const { brands } = useTaxonomy();

  return (
    <div className="flex flex-col gap-16 pb-16 md:gap-24 md:pb-24">
      <Seo
        title={`${site.name} — Authentic Sports Nutrition in Pakistan`}
        description="Genuine whey protein, creatine, pre-workout and mass gainers from 21 trusted brands. Cash on delivery across Pakistan, or visit our store in Gulshan-e-Iqbal, Karachi."
        canonicalPath="/"
        jsonLd={storeJsonLd}
      />

      <div className="flex flex-col gap-7 md:gap-9">
        <Hero brandCount={brands.length || undefined} />
        <CategoryChips />
      </div>

      <div className="page-container">
        <QueryRail
          id="best-heading"
          eyebrow="Most ordered"
          title="Best sellers"
          query={{ sort: "bestselling" }}
          action={{ label: "View all", to: "/shop?sort=bestselling" }}
        />
      </div>

      <div className="page-container">
        <CategoryTiles />
      </div>

      <WhenNear className="page-container" minHeight={420}>
        <QueryRail
          id="featured-heading"
          eyebrow="Hand-picked"
          title="Featured"
          query={{ featured: true }}
          action={{ label: "View all", to: "/shop?featured=1" }}
        />
      </WhenNear>

      <WhenNear minHeight={560}>
        <ReelsSection />
      </WhenNear>

      <WhenNear className="page-container" minHeight={360}>
        <BrandsGrid />
      </WhenNear>

      <WhenNear className="page-container" minHeight={420}>
        <QueryRail
          id="new-heading"
          eyebrow="Just in"
          title="New arrivals"
          query={{ sort: "newest" }}
          action={{ label: "View all", to: "/shop?sort=newest" }}
        />
      </WhenNear>

      <WhenNear minHeight={320}>
        <GoogleReviewsSection />
      </WhenNear>

      <WhenNear minHeight={200}>
        <StatsBand />
      </WhenNear>

      <WhenNear minHeight={260}>
        <StoreBand />
      </WhenNear>
    </div>
  );
}
