import { Suspense } from "react";
import { PageViews } from "./PageViews";
import { Link, Outlet, ScrollRestoration } from "react-router";
import { ChevronLeft, LockKeyhole, MessageCircle } from "lucide-react";
import { site, whatsappLink } from "../../config/site";
import { PageLoader } from "../ui/PageLoader";
import { Logo } from "./Logo";

/**
 * Checkout gets a quiet frame: no menus, search or promos competing with the form — just the
 * way back to the cart and a way to ask for help.
 */
export default function CheckoutLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a
        href="#main"
        className="sr-only z-50 rounded-sm bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="page-container flex h-14 items-center justify-between gap-4 md:h-16">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1 text-small font-medium text-ink-2 hover:text-ink"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            <span>
              Back<span className="hidden sm:inline"> to cart</span>
            </span>
          </Link>
          <Logo />
          <p className="inline-flex items-center gap-1.5 text-small text-ink-2">
            <LockKeyhole aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Secure checkout</span>
            <span className="sr-only sm:hidden">Secure checkout</span>
          </p>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-line py-6 text-small text-ink-2">
        <div className="page-container flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p>
            Questions about your order? Call{" "}
            <a href={`tel:${site.contact.phoneIntl}`} className="font-medium text-ink underline">
              {site.contact.phoneDisplay}
            </a>
          </p>
          <a
            href={whatsappLink("Hi, I need help with my order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline"
          >
            <MessageCircle aria-hidden="true" className="size-4" /> WhatsApp us
          </a>
        </div>
      </footer>
      <PageViews />
      <ScrollRestoration />
    </div>
  );
}
