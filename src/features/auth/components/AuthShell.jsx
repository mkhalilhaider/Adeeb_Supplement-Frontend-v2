import { Seo } from "../../../components/seo/Seo";

/**
 * Frame for the sign-in pages: one narrow column, a clear title, the form, then the
 * alternative routes (create account, forgot password) underneath.
 *
 * @param {{ title: string, subtitle?: import("react").ReactNode, footer?: import("react").ReactNode, children: import("react").ReactNode, seoTitle?: string }} props
 */
export function AuthShell({ title, subtitle, footer, children, seoTitle }) {
  return (
    <div className="page-container flex justify-center py-10 md:py-16">
      <Seo title={seoTitle ?? title} noIndex />
      <div className="w-full max-w-md">
        <h1 className="text-h1 font-extrabold uppercase font-condensed md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-2">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && (
          <div className="mt-8 border-t border-line pt-6 text-small text-ink-2">{footer}</div>
        )}
      </div>
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
      className={`rounded-sm px-4 py-3 text-small outline-none ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
