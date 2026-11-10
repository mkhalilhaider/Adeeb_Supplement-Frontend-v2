import { Seo } from "../../components/seo/Seo";
import { site } from "../../config/site";

/**
 * Phase 0 placeholder. The real homepage (hero from design/hero-mockup.html, category tiles,
 * rails, reels and reviews sliders) is built in Phase 7 from the Phase 2–3 components.
 */
export default function HomePage() {
  return (
    <section className="page-container py-16 md:py-24">
      <Seo description={site.tagline} />
      <p className="label-mono text-ink-3">Authentic sports nutrition · Karachi</p>
      <h1 className="mt-3 text-display font-extrabold uppercase font-condensed md:text-7xl">
        Genuine supplements.
        <br />
        <span className="text-brand-ink">Delivered</span> across Pakistan.
      </h1>
      <p className="mt-5 max-w-prose text-ink-2">
        The new storefront is being built. Foundation in place: routing, API client, sessions and
        design tokens.
      </p>
    </section>
  );
}
