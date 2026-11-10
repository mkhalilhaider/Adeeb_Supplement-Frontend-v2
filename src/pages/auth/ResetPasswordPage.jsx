import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { ApiError, errorMessage } from "../../lib/api/errors";
import { useForm } from "../../lib/use-form";
import { resetPassword } from "../../features/auth/api";
import { AuthShell, FormNotice } from "../../features/auth/components/AuthShell";
import { PasswordInput } from "../../features/auth/components/PasswordInput";
import { MIN_PASSWORD, passwordProblem } from "../../features/auth/lib/validation";
import { useSession } from "../../features/auth/session-store";

function validate(v) {
  const errors = {};
  const problem = passwordProblem(v.password);
  if (problem) errors.password = problem;
  else if (v.confirm !== v.password) errors.confirm = "The passwords don't match";
  return errors;
}

/**
 * /reset-password?token=… (link from the reset email). A new password signs out every
 * device, so this one is signed out too and the shopper logs in again.
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const clearSession = useSession((s) => s.clear);
  const form = useForm(() => ({ password: "", confirm: "" }));
  const [error, setError] = useState(/** @type {import("react").ReactNode} */ (""));
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <AuthShell title="Link incomplete" seoTitle="Reset your password">
        <p>
          This reset link is missing its code. Open the link from the email again, or{" "}
          <Link to="/forgot-password" className="font-semibold underline">
            ask for a new one
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  const onValid = async ({ password }) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await resetPassword({ token, password });
      clearSession();
      navigate("/login", {
        replace: true,
        state: { notice: "Password updated. Log in with your new password." },
      });
    } catch (err) {
      setPending(false);
      setError(
        err instanceof ApiError && err.status === 400 ? (
          <>
            This link has expired or was already used.{" "}
            <Link to="/forgot-password" className="font-semibold underline">
              Get a new link
            </Link>
          </>
        ) : (
          errorMessage(err)
        ),
      );
    }
  };

  return (
    <AuthShell title="New password" subtitle="Choose a new password for your account.">
      <form
        onSubmit={(event) => form.handleSubmit(validate, onValid)(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        {error && <FormNotice>{error}</FormNotice>}
        <Field
          label="New password"
          hint={`At least ${MIN_PASSWORD} characters`}
          error={form.errors.password}
        >
          {(f) => <PasswordInput {...f} {...form.field("password")} autoComplete="new-password" />}
        </Field>
        <Field label="Repeat new password" error={form.errors.confirm}>
          {(f) => <PasswordInput {...f} {...form.field("confirm")} autoComplete="new-password" />}
        </Field>
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Save new password
        </Button>
      </form>
    </AuthShell>
  );
}
