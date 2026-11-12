import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { useForm } from "../../lib/use-form";
import { login } from "../../features/auth/api";
import { PasswordInput } from "../../features/auth/components/PasswordInput";
import { EMAIL_PATTERN } from "../../features/auth/lib/validation";
import { selectIsAdmin, useSession } from "../../features/auth/session-store";
import { ApiError, errorMessage, logoutQuietly } from "./admin-auth";

/** Only internal admin paths as a post-login destination (no open redirects). */
function safeReturnTo(value) {
  return typeof value === "string" && /^\/admin(\/|$|\?)/.test(value) && !value.startsWith("//")
    ? value
    : "/admin";
}

const validate = (v) => {
  const errors = {};
  if (!EMAIL_PATTERN.test(v.email.trim())) errors.email = "Enter your admin email";
  if (!v.password) errors.password = "Enter your password";
  return errors;
};

/**
 * Separate admin sign-in: email + password only (no Google, no registration link). Admin
 * sessions live in sessionStorage, so closing the browser signs the admin out.
 */
export default function AdminLoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const signIn = useSession((s) => s.signIn);
  const isAdmin = useSession(selectIsAdmin);
  const notice = useSession((s) => s.loginNotice);
  const form = useForm(() => ({ email: "", password: "" }));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const returnTo = safeReturnTo(params.get("returnTo"));

  if (isAdmin) return <Navigate to={returnTo} replace />;

  const onValid = async (v) => {
    if (pending) return;
    setError("");
    setPending(true);
    try {
      const result = await login({ email: v.email.trim(), password: v.password });
      if (result.user.role !== "admin") {
        // Valid customer credentials, but not an admin: don't keep that session here.
        await logoutQuietly(result.tokens);
        setError("This account doesn't have admin access.");
        setPending(false);
        return;
      }
      signIn(result, "admin");
      navigate(returnTo, { replace: true });
    } catch (err) {
      setPending(false);
      setError(
        err instanceof ApiError && err.isUnauthorized
          ? "Incorrect email or password."
          : errorMessage(err),
      );
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <title>Admin sign in | Adeeb Supplement</title>
      <meta name="robots" content="noindex, nofollow" />
      <form
        onSubmit={(event) => form.handleSubmit(validate, onValid)(event)}
        noValidate
        className="w-full max-w-sm"
      >
        <p className="label-caps text-ink-3">Adeeb · Admin</p>
        <h1 className="mt-2 text-h1 font-extrabold uppercase font-condensed">Sign in</h1>

        <div className="mt-8 flex flex-col gap-4">
          {notice && !error && (
            <p role="status" className="rounded-sm bg-shelf px-3 py-2 text-small">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-small text-danger">
              {error}
            </p>
          )}
          <Field label="Email" error={form.errors.email}>
            {(f) => (
              <Input
                {...f}
                {...form.field("email")}
                type="email"
                autoComplete="username"
                autoCapitalize="none"
              />
            )}
          </Field>
          <Field label="Password" error={form.errors.password}>
            {(f) => (
              <PasswordInput {...f} {...form.field("password")} autoComplete="current-password" />
            )}
          </Field>
          <Button type="submit" size="lg" fullWidth loading={pending} className="mt-2">
            Sign in
          </Button>
        </div>
      </form>
    </div>
  );
}
