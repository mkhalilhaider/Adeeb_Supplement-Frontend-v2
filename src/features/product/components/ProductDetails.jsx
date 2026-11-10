import { Link } from "react-router";
import { tidyAttribute } from "../../../lib/format";
import { parseDescription } from "../lib/description";

/** Description from the backend, formatted (paragraphs + lists) — never embellished. */
export function ProductDescription({ text }) {
  const blocks = parseDescription(text);
  if (blocks.length === 0) return <p className="text-ink-3">No description yet.</p>;
  return (
    <div className="flex max-w-prose flex-col gap-4 text-ink-2">
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={i} className="flex flex-col gap-2">
            {block.items.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-ink" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>{block.text}</p>
        ),
      )}
    </div>
  );
}

/**
 * Facts table in the "supplement label" style. Only fields the product actually has; values
 * that vary list every option (e.g. all flavours).
 */
export function ProductSpecs({ product, variants, variant }) {
  const all = (key) =>
    [...new Set(variants.map((v) => tidyAttribute(v.attributes?.[key])).filter(Boolean))].join(
      ", ",
    );

  const rows = [
    [
      "Brand",
      product.brand && (
        <Link to={`/brand/${product.brand.slug}`} className="underline underline-offset-2">
          {product.brand.name}
        </Link>
      ),
    ],
    [
      "Category",
      product.category && (
        <Link to={`/category/${product.category.slug}`} className="underline underline-offset-2">
          {product.category.name}
        </Link>
      ),
    ],
    ["Flavours", all("flavor")],
    ["Size", all("weight")],
    ["Servings", all("serving")],
    ["SKU", variant?.sku && <span className="font-mono text-small">{variant.sku}</span>],
  ].filter(([, value]) => value);

  return (
    <dl className="border-t-2 border-ink">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-line py-3">
          <dt className="pt-0.5 label-mono text-ink-3">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
