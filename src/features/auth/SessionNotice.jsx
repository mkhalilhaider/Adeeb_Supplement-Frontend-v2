import { useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "./session-store";

/** Tells the user once, calmly, when their session ended on its own (not when they logged out). */
export function SessionNotice() {
  const expired = useSession((s) => s.expired);
  const acknowledge = useSession((s) => s.acknowledgeExpired);

  useEffect(() => {
    if (!expired) return;
    toast("Your session expired", { description: "Please log in again to continue." });
    acknowledge();
  }, [expired, acknowledge]);

  return null;
}
