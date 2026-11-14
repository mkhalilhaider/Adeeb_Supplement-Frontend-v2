import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { ApiError, errorMessage } from "../../lib/api/errors";
import { useForm } from "../../lib/use-form";
import { register } from "../../features/auth/api";
import { AuthShell, FormNotice } from "../../features/auth/components/AuthShell";
import { GoogleButton } from "../../features/auth/components/GoogleButton";
import { PasswordInput } from "../../features/auth/components/PasswordInput";
import { loginPath, safeReturnTo } from "../../features/auth/lib/return-to";
import { EMAIL_PATTERN, MIN_PASSWORD, passwordProblem } from "../../features/auth/lib/validation";
import { useSession } from "../../features/auth/session-store";
import { notify } from "../../lib/notify";

function validate(v) {
  const errors = {};
  if (!v.firstName.trim()) errors.firstName = "Enter your first name";
  if (!v.lastName.trim()) errors.lastName = "Enter your last name";
  if (!EMAIL_PATTERN.test(v.email.trim())) errors.email = "Enter a valid email address";
  const problem = passwordProblem(v.password);
  if (problem) errors.password = problem;
  return errors;
}

/** /register — creates the account and signs in straight away (the backend logs in on register). */
export default function RegisterPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = useSession((s) => s.status);
  const signIn = useSession((s) => s.signIn);
  const returnTo = safeReturnTo(params.get("returnTo"));

  const form = useForm(() => ({ firstName: "", lastName: "", email: "", password: "" }));
  const [error, setError] = useState(/** @type {import("react").ReactNode} */ (""));
  const [pending, setPending] = useState(false);
  const errorRef = useRef(/** @type {HTMLDivElement|null} */ (null));

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  if (status === "authenticated") return <Navigate to={returnTo} replace />;

  const onValid = async (values) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      signIn(result);
      notify.success("Account created — welcome to Adeeb!");
      navigate(returnTo, { replace: true });
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && err.isConflict) {
        setError(
          <>
            An account with this email already exists.{" "}
            <Link
              to={loginPath(params.get("returnTo"))}
              state={{ email: values.email.trim() }}
              className="font-semibold underline"
            >
              Log in instead
            </Link>
          </>,
        );
      } else {
        setError(errorMessage(err));
      }
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Faster checkout, saved addresses and your order history in one place."
      footer={
        <p>
          Already have an account?{" "}
          <Link to={loginPath(params.get("returnTo"))} className="font-semibold text-ink underline">
            Log in
          </Link>
        </p>
      }
    >
      <GoogleButton returnTo={returnTo} label="Sign up with Google" />
      <form
        onSubmit={(event) => form.handleSubmit(validate, onValid)(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        {error && <FormNotice ref={errorRef}>{error}</FormNotice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={form.errors.firstName}>
            {(f) => <Input {...f} {...form.field("firstName")} autoComplete="given-name" />}
          </Field>
          <Field label="Last name" error={form.errors.lastName}>
            {(f) => <Input {...f} {...form.field("lastName")} autoComplete="family-name" />}
          </Field>
        </div>
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
        <Field
          label="Password"
          hint={`At least ${MIN_PASSWORD} characters`}
          error={form.errors.password}
        >
          {(f) => <PasswordInput {...f} {...form.field("password")} autoComplete="new-password" />}
        </Field>
        <Button type="submit" size="lg" fullWidth loading={pending} className="mt-2">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
