import { useRef } from "react";
import { Link } from "react-router";
import { ChevronDown } from "lucide-react";
import { CloudImage } from "../ui/CloudImage";
import { cn } from "../../lib/cn";
import { useOutsideClick, useRouteScopedToggle } from "../../lib/hooks";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";

/**
 * Desktop "Brands" mega-menu: logo grid of every brand we stock. Opens on click (works for
 * keyboard and touch-screen laptops alike), closes on Esc, outside click or navigation.
 */
export function BrandsMenu() {
  const { brands } = useTaxonomy();
  const { open, setOpen, toggle } = useRouteScopedToggle();
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  useOutsideClick([buttonRef, panelRef], () => setOpen(false), open);

  const onKeyDown = (event) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Esc handling for the menu region
    <div onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="brands-menu"
        onClick={toggle}
        className={cn(
          "flex h-12 items-center gap-1 border-b-2 text-small font-semibold transition-colors",
          open
            ? "border-brand text-white"
            : "border-transparent text-night-muted hover:border-brand hover:text-white",
        )}
      >
        Brands
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 transition-transform duration-(--duration-base)",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="brands-menu"
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
      )}
    </div>
  );
}
