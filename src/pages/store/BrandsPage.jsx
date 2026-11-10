import { Link } from "react-router";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { CloudImage } from "../../components/ui/CloudImage";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";

/** /brands — every brand we stock, grouped A–Z. Uses cached taxonomy (usually 0 requests). */
export default function BrandsPage() {
  const { brands, isPending, error, refetch } = useTaxonomy();

  const groups = brands.reduce((acc, brand) => {
    const letter = /[a-z]/i.test(brand.name[0]) ? brand.name[0].toUpperCase() : "#";
    (acc[letter] ??= []).push(brand);
    return acc;
  }, {});
  const letters = Object.keys(groups).sort();

  return (
    <div className="page-container pb-16">
      <Seo
        title="Supplement brands we stock"
        description={`Authentic products from ${brands.length || "21"} trusted brands including Optimum Nutrition, Dymatize, MuscleTech and Kevin Levrone. Cash on delivery across Pakistan.`}
        canonicalPath="/brands"
      />
      <header className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Brands" }]} />
        <p className="mt-6 label-mono text-ink-3">Authentic brands only</p>
        <h1 className="mt-1 text-h1 font-extrabold uppercase font-condensed md:text-5xl">
          Brands A–Z
        </h1>
      </header>

      {error && !brands.length ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          {!isPending && (
            <nav aria-label="Jump to letter" className="mt-6 flex flex-wrap gap-1">
              {letters.map((l) => (
                <a
                  key={l}
                  href={`#brands-${l}`}
                  className="flex size-9 items-center justify-center rounded-sm border border-line font-mono text-small hover:border-ink"
                >
                  {l}
                </a>
              ))}
            </nav>
          )}

          <div className="mt-8 flex flex-col gap-10">
            {isPending ? (
              <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <span className="sr-only">Loading brands</span>
                {Array.from({ length: 10 }, (_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              letters.map((letter) => (
                <section
                  key={letter}
                  id={`brands-${letter}`}
                  aria-labelledby={`brands-${letter}-h`}
                  className="scroll-mt-28"
                >
                  <h2
                    id={`brands-${letter}-h`}
                    className="flex items-center gap-3 font-mono text-h3 font-medium"
                  >
                    {letter}
                    <span aria-hidden="true" className="h-px flex-1 bg-line" />
                  </h2>
                  <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {groups[letter].map((brand) => (
                      <li key={brand._id}>
                        <Link
                          to={`/brand/${brand.slug}`}
                          className="flex h-full flex-col items-center gap-3 bg-shelf p-4 transition-colors hover:bg-line"
                        >
                          <span className="flex h-16 w-full items-center justify-center">
                            <CloudImage
                              src={brand.logoUrl}
                              alt=""
                              trim
                              ratio={null}
                              sizes="200px"
                              blend
                              className="h-16 w-full"
                            />
                          </span>
                          <span className="text-center font-semibold">{brand.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
