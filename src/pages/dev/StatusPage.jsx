import { useQuery } from "@tanstack/react-query";
import { env } from "../../config/env";
import { api } from "../../lib/api";
import { useBrands, useCategories } from "../../features/catalog/queries";
import { useSession } from "../../features/auth/session-store";

function Row({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3">
      <span className="label-caps text-ink-3">{label}</span>
      <span className={ok === false ? "text-danger" : ok ? "text-success" : "text-ink"}>
        {value}
      </span>
    </div>
  );
}

/** Development-only diagnostics (route is not registered in production builds). */
export default function StatusPage() {
  const health = useQuery({
    queryKey: ["dev", "health"],
    queryFn: ({ signal }) => api.get("/health", { signal }),
  });
  const categories = useCategories();
  const brands = useBrands();
  const session = useSession();

  const state = (q, render) =>
    q.isPending ? "Loading…" : q.isError ? q.error.message : render(q.data);

  return (
    <section className="page-container max-w-2xl py-12">
      <title>Dev status</title>
      <meta name="robots" content="noindex" />
      <h1 className="text-h1 font-extrabold uppercase font-condensed">Foundation status</h1>
      <div className="mt-6">
        <Row label="API base" value={env.apiUrl} />
        <Row
          label="Health"
          value={state(health, (d) => d.message)}
          ok={health.isSuccess ? true : health.isError ? false : undefined}
        />
        <Row
          label="Categories"
          value={state(categories, (d) => `${d.length} loaded`)}
          ok={categories.isSuccess || undefined}
        />
        <Row
          label="Brands"
          value={state(brands, (d) => `${d.length} loaded`)}
          ok={brands.isSuccess || undefined}
        />
        <Row
          label="Session"
          value={`${session.status}${session.user ? ` · ${session.user.email} (${session.user.role})` : ""}`}
        />
      </div>
    </section>
  );
}
