import { lazy, Suspense } from "react";
import { PageLoader } from "../../components/ui/PageLoader";
import { RequireAdmin } from "../../features/auth/guards";

const AdminApp = lazy(() => import("./AdminApp"));

/**
 * /admin/* — checks the admin role first, then loads the admin app (its own routes and
 * chunks). Shoppers never download more than this small file.
 */
export default function AdminEntry() {
  return (
    <RequireAdmin>
      <Suspense fallback={<PageLoader />}>
        <AdminApp />
      </Suspense>
    </RequireAdmin>
  );
}
