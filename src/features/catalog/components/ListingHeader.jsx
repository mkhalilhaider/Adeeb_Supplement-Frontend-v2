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
    <header className="pt-5 md:pt-8">
      <Breadcrumbs items={crumbs} />
      <div className={cn("mt-4 flex items-center gap-4 md:mt-6 md:gap-6", !visual && "block")}>
        {visual && (
          <span
            className={cn(
              "shrink-0 overflow-hidden rounded-card border border-line bg-surface",
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
          {eyebrow && <p className="label-caps text-brand-ink">{eyebrow}</p>}
          <h1 className="mt-1 text-[2.75rem] font-display md:text-[4rem]">{title}</h1>
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
