import { useState } from "react";
import { Link, useLocation } from "react-router";
import { MailCheck } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { errorMessage } from "../../lib/api/errors";
import { useForm } from "../../lib/use-form";
import { requestPasswordReset } from "../../features/auth/api";
import { AuthShell, FormNotice } from "../../features/auth/components/AuthShell";
import { EMAIL_PATTERN } from "../../features/auth/lib/validation";

const validate = (v) =>
  EMAIL_PATTERN.test(v.email.trim()) ? {} : { email: "Enter the email you signed up with" };

/**
 * /forgot-password — asks the backend to email a reset link. The answer is the same whether
 * or not the email has an account, so this page never reveals who is a customer.
 */
export default function ForgotPasswordPage() {
  const location = useLocation();
  const form = useForm(() => ({ email: location.state?.email ?? "" }));
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onValid = async ({ email }) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSentTo(email.trim());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell
        title="Check your email"
        seoTitle="Reset your password"
        footer={
          <Link to="/login" className="font-semibold text-ink underline">
            Back to log in
          </Link>
        }
      >
        <div role="status" className="flex flex-col gap-3">
          <MailCheck aria-hidden="true" className="size-8 text-success" />
          <p>
            If an account exists for <span className="font-semibold">{sentTo}</span>, we've sent a
            link to reset the password. It may take a minute — check your spam folder too.
          </p>
          <p className="text-small text-ink-2">
            Signed up with Google? Use “Continue with Google” on the log-in page instead.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email and we'll send you a link to choose a new password."
      footer={
        <Link to="/login" className="font-semibold text-ink underline">
          Back to log in
        </Link>
      }
    >
      <form
        onSubmit={(event) => form.handleSubmit(validate, onValid)(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        {error && <FormNotice>{error}</FormNotice>}
        <Field label="Email" error={form.errors.email}>
          {(f) => (
            <Input
              {...f}
              {...form.field("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
            />
          )}
        </Field>
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
