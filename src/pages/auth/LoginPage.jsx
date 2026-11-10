import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { ApiError, errorMessage } from "../../lib/api/errors";
import { useForm } from "../../lib/use-form";
import { login } from "../../features/auth/api";
import { AuthShell, FormNotice } from "../../features/auth/components/AuthShell";
import { GoogleButton } from "../../features/auth/components/GoogleButton";
import { PasswordInput } from "../../features/auth/components/PasswordInput";
import { loginPath, safeReturnTo } from "../../features/auth/lib/return-to";
import { EMAIL_PATTERN } from "../../features/auth/lib/validation";
import { useSession } from "../../features/auth/session-store";

function validate(v) {
  const errors = {};
  if (!EMAIL_PATTERN.test(v.email.trim())) errors.email = "Enter your email address";
  if (!v.password) errors.password = "Enter your password";
  return errors;
}

/** /login — email + password (and Google when enabled). Goes back to ?returnTo afterwards. */
export default function LoginPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const status = useSession((s) => s.status);
  const signIn = useSession((s) => s.signIn);
  const returnTo = safeReturnTo(params.get("returnTo"));
  const storedNotice = useSession((s) => s.loginNotice);
  const notice = location.state?.notice || storedNotice;

  const form = useForm(() => ({ email: location.state?.email ?? "", password: "" }));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const errorRef = useRef(/** @type {HTMLDivElement|null} */ (null));

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  // Already signed in (or just signed in): straight on.
  if (status === "authenticated") return <Navigate to={returnTo} replace />;

  const onValid = async (values) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await login({ email: values.email.trim(), password: values.password });
      signIn(result);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.isUnauthorized
          ? "That email and password don't match. Check them and try again."
          : errorMessage(err),
      );
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Track orders, save addresses and check out faster."
      footer={
        <p>
          New here?{" "}
          <Link
            to={loginPath(params.get("returnTo"), "/register")}
            className="font-semibold text-ink underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <GoogleButton returnTo={returnTo} />
      <form
        onSubmit={(event) => form.handleSubmit(validate, onValid)(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        {notice && <FormNotice tone="success">{notice}</FormNotice>}
        {error && <FormNotice ref={errorRef}>{error}</FormNotice>}
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
        <Field label="Password" error={form.errors.password}>
          {(f) => (
            <PasswordInput {...f} {...form.field("password")} autoComplete="current-password" />
          )}
        </Field>
        <Link
          to="/forgot-password"
          state={{ email: form.values.email }}
          className="-mt-1 self-start text-small font-medium text-ink-2 underline hover:text-ink"
        >
          Forgot your password?
        </Link>
        <Button type="submit" size="lg" fullWidth loading={pending} className="mt-2">
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
