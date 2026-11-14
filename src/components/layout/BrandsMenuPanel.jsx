import { Link } from "react-router";
import { CloudImage } from "../ui/CloudImage";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";

/** Panel of the "Brands" menu (loaded on demand): a logo grid of every brand we stock. */
export default function BrandsMenuPanel({ id }) {
  const { brands } = useTaxonomy();
  return (
    <div
      id={id}
      className="absolute inset-x-0 top-full z-40 border-b border-line bg-surface text-ink shadow-overlay"
    >
      <div className="page-container py-6">
        <div className="flex items-baseline justify-between">
          <p className="label-caps text-ink-3">{brands.length} brands we stock</p>
          <Link
            to="/brands"
            className="text-small font-semibold underline-offset-4 hover:underline"
          >
            All brands A–Z
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-5 gap-2 xl:grid-cols-7">
          {brands.map((brand) => (
            <li key={brand._id}>
              <Link
                to={`/brand/${brand.slug}`}
                className="group flex flex-col items-center gap-2 rounded-sm p-3 transition-colors hover:bg-shelf"
              >
                <span className="flex h-12 w-full items-center justify-center">
                  <CloudImage
                    src={brand.logoUrl}
                    alt=""
                    trim
                    ratio={null}
                    sizes="120px"
                    blend
                    className="h-12 w-full"
                  />
                </span>
                <span className="text-center text-small text-ink-2 group-hover:text-ink">
                  {brand.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
