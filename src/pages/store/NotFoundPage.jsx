import { Link } from "react-router";
import { Seo } from "../../components/seo/Seo";

export default function NotFoundPage() {
  return (
    <section className="page-container py-20 md:py-28">
      <Seo title="Page not found" noIndex />
      <p className="label-mono text-ink-3">Error 404</p>
      <h1 className="mt-3 text-h1 font-extrabold uppercase font-condensed md:text-5xl">
        This page isn't on the shelf
      </h1>
      <p className="mt-4 max-w-prose text-ink-2">
        The link may be old or mistyped. Try the shop, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/shop"
          className="inline-flex h-12 items-center rounded-md bg-brand px-6 font-semibold text-ink transition-colors duration-(--duration-fast) hover:bg-brand-hover"
        >
          Browse all products
        </Link>
        <Link
          to="/"
          className="inline-flex h-12 items-center rounded-md border border-ink px-6 font-semibold transition-colors duration-(--duration-fast) hover:bg-ink hover:text-paper"
        >
          Go to homepage
        </Link>
      </div>
    </section>
  );
}
