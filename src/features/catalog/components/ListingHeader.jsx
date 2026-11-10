import { Breadcrumbs } from "../../../components/ui/Breadcrumbs";
import { CloudImage } from "../../../components/ui/CloudImage";
import { cn } from "../../../lib/cn";

/**
 * Title block for listing pages. A category shows its image, a brand its logo; descriptions
 * come from the backend (shortened on phones so products appear above the fold).
 *
 * @param {{ crumbs: {label: string, to?: string}[], eyebrow?: string, title: string, description?: string, image?: string, logo?: string }} props
 */
export function ListingHeader({ crumbs, eyebrow, title, description, image, logo }) {
  const visual = image || logo;
  return (
    <header className="pt-4 md:pt-6">
      <Breadcrumbs items={crumbs} />
      <div className={cn("mt-4 flex items-center gap-4 md:mt-6 md:gap-6", !visual && "block")}>
        {visual && (
          <span
            className={cn(
              "shrink-0 bg-shelf",
              logo
                ? "flex size-16 items-center justify-center p-2 md:size-24 md:p-3"
                : "size-16 md:size-24",
            )}
          >
            <CloudImage
              src={visual}
              alt=""
              ratio={logo ? null : "square"}
              sizes="96px"
              priority
              trim={Boolean(logo)}
              blend
              className={logo ? "size-full" : undefined}
            />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="label-mono text-ink-3">{eyebrow}</p>}
          <h1 className="mt-1 text-h1 font-extrabold uppercase font-condensed md:text-5xl">
            {title}
          </h1>
        </div>
      </div>
      {description && (
        <p className="mt-3 line-clamp-2 max-w-3xl text-small text-ink-2 md:mt-4 md:line-clamp-none md:text-body">
          {description}
        </p>
      )}
    </header>
  );
}
