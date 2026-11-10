import { Banknote, House, ShieldCheck, Truck } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { Button } from "../../components/ui/Button";
import { site } from "../../config/site";
import { STORY } from "../../content/story";

const ICONS = { authentic: ShieldCheck, cod: Banknote, delivery: Truck, store: House };

/** /about — the shop's story in the owner's words, plus what customers can count on. */
export default function AboutPage() {
  return (
    <div className="page-container pb-16">
      <Seo
        title="About us"
        description="Adeeb Supplement: authentic supplements at affordable prices for Pakistan, importing genuine products since April 2026."
        canonicalPath="/about"
      />
      <Breadcrumbs
        className="pt-4 md:pt-6"
        items={[{ label: "Home", to: "/" }, { label: "About" }]}
      />

      <div className="mt-6 grid gap-10 md:grid-cols-[2fr_3fr] md:gap-14">
        <figure className="md:sticky md:top-24 md:self-start">
          <a
            href={site.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-sm bg-shelf"
          >
            <img
              src="/founder.jpeg"
              alt="Adeeb, founder of Adeeb Supplement"
              width={600}
              height={750}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover"
            />
          </a>
          <figcaption className="mt-3 label-mono text-ink-3">{STORY.pinLine}</figcaption>
        </figure>

        <article>
          <p className="label-mono text-ink-3">{STORY.eyebrow}</p>
          <h1 className="mt-2 text-h1 font-extrabold uppercase font-condensed md:text-5xl">
            {STORY.title}
          </h1>
          <div className="mt-6 flex max-w-[62ch] flex-col gap-4 leading-relaxed text-ink-2">
            {STORY.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2">
            {site.trust.map((t) => {
              const Icon = ICONS[t.id] ?? ShieldCheck;
              return (
                <li key={t.id} className="flex gap-3 bg-surface p-5">
                  <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <span className="block font-semibold">{t.title}</span>
                    <span className="text-small text-ink-2">{t.detail}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/shop" size="lg">
              Shop now
            </Button>
            <Button to="/contact" size="lg" variant="outline">
              Contact us
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
