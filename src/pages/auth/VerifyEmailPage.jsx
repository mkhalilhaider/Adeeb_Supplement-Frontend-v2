import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { verifyEmail } from "../../features/auth/api";
import { AuthShell } from "../../features/auth/components/AuthShell";
import { useSession } from "../../features/auth/session-store";

/** /verify-email?token=… (link from the verification email). */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const loggedIn = useSession((s) => s.status === "authenticated");
  const verify = useSession((s) => s.verify);

  const result = useQuery({
    queryKey: ["verify-email", token],
    queryFn: async ({ signal }) => {
      const response = await verifyEmail(token, { signal });
      // Refresh the signed-in user so "verified" shows everywhere.
      if (loggedIn) verify({ force: true }).catch(() => {});
      return response;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });

  const next = (
    <Button to={loggedIn ? "/account" : "/login"} size="lg">
      {loggedIn ? "Go to your account" : "Log in"}
    </Button>
  );

  if (!token || result.isError) {
    return (
      <AuthShell title="Link not valid" seoTitle="Verify your email">
        <div role="alert" className="flex flex-col items-start gap-4">
          <CircleX aria-hidden="true" className="size-8 text-danger" />
          <p>
            This verification link has expired or was already used. If you can log in, your account
            works as normal.
          </p>
          {next}
        </div>
      </AuthShell>
    );
  }

  if (result.isPending) {
    return (
      <AuthShell title="Verifying" seoTitle="Verify your email">
        <p role="status" className="flex items-center gap-3 text-ink-2">
          <Spinner /> Confirming your email address…
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Email verified" seoTitle="Verify your email">
      <div role="status" className="flex flex-col items-start gap-4">
        <CircleCheck aria-hidden="true" className="size-8 text-success" />
        <p>Thanks — your email address is confirmed.</p>
        {next}
      </div>
    </AuthShell>
  );
}
