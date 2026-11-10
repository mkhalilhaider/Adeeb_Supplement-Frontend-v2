import { Link, useLocation } from "react-router";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { site, whatsappLink } from "../../config/site";
import { PRIVACY, REFUND, TERMS } from "../../content/legal";

/** The shop's own policy texts (content/legal.js), one route each. */
const DOCS = {
  "/privacy": {
    doc: PRIVACY,
    description: "How Adeeb Supplement collects, uses and protects your personal information.",
  },
  "/terms": { doc: TERMS, description: "The terms that apply when you shop at Adeeb Supplement." },
  "/refund-policy": {
    doc: REFUND,
    description:
      "Refunds and exchanges at Adeeb Supplement: 7-day exchanges for unopened items, damaged or incorrect items.",
  },
};

const OTHERS = [
  { to: "/refund-policy", label: "Refund & exchanges" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
];

/** /privacy, /terms, /refund-policy */
export default function LegalPage() {
  const { pathname } = useLocation();
  const { doc, description } = DOCS[pathname] ?? DOCS["/terms"];

  return (
    <div className="page-container pb-16">
      <Seo title={doc.title} description={description} canonicalPath={pathname} />
      <Breadcrumbs
        className="pt-4 md:pt-6"
        items={[{ label: "Home", to: "/" }, { label: doc.title }]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_16rem] lg:gap-16">
        <article className="max-w-[68ch]">
          <p className="label-mono text-ink-3">Last updated {doc.lastUpdated}</p>
          <h1 className="mt-2 text-h1 font-extrabold uppercase font-condensed md:text-5xl">
            {doc.title}
          </h1>
          {doc.intro && <p className="mt-5 text-body leading-relaxed text-ink-2">{doc.intro}</p>}
          <div className="mt-8 flex flex-col gap-7">
            {doc.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-h3 font-bold">{section.title}</h2>
                <p className="mt-2 leading-relaxed text-ink-2">{section.body}</p>
              </section>
            ))}
          </div>
        </article>

        <aside className="flex flex-col gap-6 text-small lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Policies">
            <p className="label-mono text-ink-3">Policies</p>
            <ul className="mt-3 flex flex-col gap-2">
              {OTHERS.map((o) => (
                <li key={o.to}>
                  <Link
                    to={o.to}
                    aria-current={o.to === pathname ? "page" : undefined}
                    className="underline-offset-4 hover:underline aria-[current=page]:font-semibold"
                  >
                    {o.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="rounded-sm border border-line bg-surface p-4">
            <p className="font-semibold">Questions?</p>
            <p className="mt-1 text-ink-2">
              Call{" "}
              <a href={`tel:${site.contact.phoneIntl}`} className="underline">
                {site.contact.phoneDisplay}
              </a>{" "}
              or{" "}
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                message us on WhatsApp
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
