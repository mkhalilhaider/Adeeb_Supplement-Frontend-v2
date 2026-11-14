import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Section header in the "spec label" style: numbered mono eyebrow with a hairline rule,
 * condensed title, optional "View all" link aligned right.
 *
 * @param {{ eyebrow?: string, index?: number, title: string, as?: "h1"|"h2"|"h3", action?: { label: string, to: string } }} props
 */
export function SectionHeading({ eyebrow, index, title, as: Tag = "h2", action, id, className }) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        {(eyebrow || index != null) && (
          <p className="flex items-center gap-2.5 label-caps text-brand-ink">
            {index != null && <span className="text-ink">{String(index).padStart(2, "0")}</span>}
            {eyebrow}
          </p>
        )}
        <Tag id={id} className="mt-2 text-[2.5rem] font-display md:text-[3.25rem] lg:text-[4rem]">
          {title}
        </Tag>
      </div>
      {action && (
        <Link
          to={action.to}
          className="group inline-flex shrink-0 items-center gap-1.5 pb-1 text-small font-bold hover:text-brand-ink md:text-body"
        >
          {action.label}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
