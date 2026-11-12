import { Seo } from "../../../components/seo/Seo";
import { site } from "../../../config/site";
import { cutoutSrc, LEAD_PACK } from "../../home/hero-packs";

/**
 * Frame for the sign-in pages: one narrow column, a clear title, the form, then the
 * alternative routes (create account, forgot password) underneath.
 *
 * @param {{ title: string, subtitle?: import("react").ReactNode, footer?: import("react").ReactNode, children: import("react").ReactNode, seoTitle?: string }} props
 */
export function AuthShell({ title, subtitle, footer, children, seoTitle }) {
  return (
    <div className="page-container py-8 md:py-14">
      <Seo title={seoTitle ?? title} noIndex />
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-band border border-line bg-surface lg:grid-cols-[1fr_1.1fr]">
        <BrandPanel />
        <div className="p-6 sm:p-10 lg:p-12">
          <h1 className="text-[2.75rem] font-display md:text-[3.5rem]">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-2">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && (
            <div className="mt-8 border-t border-line pt-6 text-small text-ink-2">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Desktop-only brand side: the hero pack and the owner-confirmed promises. */
function BrandPanel() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden flex-col justify-end gap-6 overflow-hidden bg-night-deep p-10 text-night-text lg:flex"
      style={{
        backgroundImage:
          "radial-gradient(70% 50% at 50% 35%, rgb(243 107 39 / 0.32), rgb(243 107 39 / 0) 70%)",
      }}
    >
      <img
        src={cutoutSrc(LEAD_PACK.id, 400)}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute top-10 left-1/2 h-[46%] w-auto -translate-x-1/2 drop-shadow-[0_24px_30px_rgb(0_0_0/0.6)]"
      />
      <p className="relative text-[2.5rem] font-display text-white">
        Train hard.
        <br />
        <span className="text-brand">Fuel genuine.</span>
      </p>
      <ul className="relative flex flex-col gap-2.5 text-small text-night-muted">
        {site.trust.slice(0, 3).map((t) => (
          <li key={t.id} className="flex items-center gap-2.5">
            <span className="size-1.5 rounded-full bg-brand" />
            <span>
              <strong className="font-semibold text-white">{t.title}</strong> — {t.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Inline message above a form (errors, "check your email", "password updated"). */
export function FormNotice({ tone = "danger", children, ref }) {
  const tones = {
    danger: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    info: "bg-shelf text-ink",
  };
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-md px-4 py-3 text-small outline-none ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
