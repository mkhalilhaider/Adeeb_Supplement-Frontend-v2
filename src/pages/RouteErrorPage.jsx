import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { ApiError } from "../lib/api";
import NotFoundPage from "./store/NotFoundPage";

/** A deploy replaced the code chunk this tab expected — a reload fixes it. */
function isChunkLoadError(error) {
  const message = String(error?.message ?? "");
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(
    message,
  );
}

/**
 * Last-resort screen for errors thrown while loading or rendering a route. Feature screens
 * handle their own expected errors inline; this only catches what slipped through.
 */
export default function RouteErrorPage() {
  const error = useRouteError();

  if (
    (isRouteErrorResponse(error) && error.status === 404) ||
    (error instanceof ApiError && error.isNotFound)
  ) {
    return <NotFoundPage />;
  }

  const chunk = isChunkLoadError(error);
  const offline = error instanceof ApiError && (error.isNetwork || error.isTimeout);

  if (import.meta.env.DEV) console.error(error);

  return (
    <section role="alert" className="page-container py-20 md:py-28">
      <title>Something went wrong | Adeeb Supplement</title>
      <p className="label-caps text-ink-3">{chunk ? "Update available" : "Error"}</p>
      <h1 className="mt-3 text-[2.75rem] font-display md:text-[4rem]">
        {chunk
          ? "The site was just updated"
          : offline
            ? "You seem to be offline"
            : "Something went wrong"}
      </h1>
      <p className="mt-4 max-w-prose text-ink-2">
        {chunk
          ? "Reload the page to get the latest version. Your cart is saved."
          : offline
            ? "Check your internet connection, then try again."
            : "Please try again. If it keeps happening, contact us on WhatsApp and we'll help."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="lift-brand inline-flex h-12 items-center rounded-md bg-brand px-6 font-semibold text-ink transition-[background-color,color,box-shadow,translate,scale] duration-(--duration-fast) hover:bg-brand-hover active:scale-[0.97]"
        >
          Reload page
        </button>
        <Link
          to="/"
          className="inline-flex h-12 items-center rounded-md border border-ink px-6 font-semibold transition-colors duration-(--duration-fast) hover:bg-ink hover:text-paper"
        >
          Go to homepage
        </Link>
      </div>
    </section>
  );
}
