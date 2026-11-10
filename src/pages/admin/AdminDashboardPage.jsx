import { useSession } from "../../features/auth/session-store";

/** Phase 0 placeholder — proves the admin guard works. The dashboard is built in Phase 8. */
export default function AdminDashboardPage() {
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);

  return (
    <section>
      <title>Dashboard | Admin</title>
      <h1 className="text-h1 font-extrabold uppercase font-condensed">Dashboard</h1>
      <p className="mt-2 text-ink-2">
        Signed in as {user?.firstName} ({user?.email}). Admin modules arrive in Phase 8.
      </p>
      <button
        type="button"
        onClick={signOut}
        className="mt-6 h-10 rounded-md border border-ink px-4 text-small font-semibold hover:bg-ink hover:text-paper"
      >
        Sign out
      </button>
    </section>
  );
}
