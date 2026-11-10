import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Seo } from "../../components/seo/Seo";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ApiError, errorMessage } from "../../lib/api/errors";
import { notify } from "../../lib/notify";
import { useForm } from "../../lib/use-form";
import { accountKeys, changePassword, updateProfile } from "../../features/account/api";
import { useProfile } from "../../features/account/queries";
import { PasswordInput } from "../../features/auth/components/PasswordInput";
import { MIN_PASSWORD, passwordProblem } from "../../features/auth/lib/validation";
import { useSession } from "../../features/auth/session-store";

function Card({ title, description, children }) {
  const id = `settings-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="rounded-sm border border-line bg-surface p-5 md:p-6">
      <h2 id={id} className="text-h3 font-bold">
        {title}
      </h2>
      {description && <p className="mt-1 text-small text-ink-2">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileForm({ profile }) {
  const queryClient = useQueryClient();
  const verify = useSession((s) => s.verify);
  const form = useForm(() => ({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
  }));
  const [pending, setPending] = useState(false);

  const validate = (v) => {
    const errors = {};
    if (!v.firstName.trim()) errors.firstName = "Enter your first name";
    if (!v.lastName.trim()) errors.lastName = "Enter your last name";
    return errors;
  };

  const onValid = async (v) => {
    if (pending) return;
    setPending(true);
    try {
      await updateProfile({ firstName: v.firstName.trim(), lastName: v.lastName.trim() });
      await queryClient.invalidateQueries({ queryKey: accountKeys.profile });
      verify({ force: true }).catch(() => {}); // header greeting picks up the new name
      notify.success("Name updated");
    } catch (err) {
      notify.error(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => form.handleSubmit(validate, onValid)(event)}
      noValidate
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="First name" error={form.errors.firstName}>
        {(f) => <Input {...f} {...form.field("firstName")} autoComplete="given-name" />}
      </Field>
      <Field label="Last name" error={form.errors.lastName}>
        {(f) => <Input {...f} {...form.field("lastName")} autoComplete="family-name" />}
      </Field>
      <Field label="Email" hint="Your email can't be changed" className="sm:col-span-2">
        {(f) => <Input {...f} value={profile.email} readOnly disabled />}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Save name
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const endWithNotice = useSession((s) => s.endWithNotice);
  const verify = useSession((s) => s.verify);
  const form = useForm(() => ({ currentPassword: "", newPassword: "", confirm: "" }));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const validate = (v) => {
    const errors = {};
    if (!v.currentPassword) errors.currentPassword = "Enter your current password";
    const problem = passwordProblem(v.newPassword);
    if (problem) errors.newPassword = problem;
    else if (v.newPassword === v.currentPassword)
      errors.newPassword = "Choose a password different from the current one";
    else if (v.confirm !== v.newPassword) errors.confirm = "The passwords don't match";
    return errors;
  };

  const onValid = async (v) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      // The password call can't refresh an expired token (its 401 means "wrong password"),
      // so make sure the session is fresh first.
      await verify({ force: true });
      await changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword });
      // The backend signs out every device, this one included.
      // The account guard then sends the shopper to log in, where this message shows.
      endWithNotice("Password changed. Log in again with your new password.");
    } catch (err) {
      setPending(false);
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your current password isn't right."
          : err instanceof ApiError && err.status === 400
            ? err.message
            : errorMessage(err),
      );
    }
  };

  return (
    <form
      onSubmit={(event) => form.handleSubmit(validate, onValid)(event)}
      noValidate
      className="flex max-w-md flex-col gap-4"
    >
      {error && (
        <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-small text-danger">
          {error}
        </p>
      )}
      <Field label="Current password" error={form.errors.currentPassword}>
        {(f) => (
          <PasswordInput
            {...f}
            {...form.field("currentPassword")}
            autoComplete="current-password"
          />
        )}
      </Field>
      <Field
        label="New password"
        hint={`At least ${MIN_PASSWORD} characters`}
        error={form.errors.newPassword}
      >
        {(f) => <PasswordInput {...f} {...form.field("newPassword")} autoComplete="new-password" />}
      </Field>
      <Field label="Repeat new password" error={form.errors.confirm}>
        {(f) => <PasswordInput {...f} {...form.field("confirm")} autoComplete="new-password" />}
      </Field>
      <div>
        <Button type="submit" loading={pending}>
          Change password
        </Button>
      </div>
    </form>
  );
}

/** /account/settings — name and password. */
export default function SettingsPage() {
  const profile = useProfile();
  const googleOnly = profile.data?.authProvider === "google";

  return (
    <div className="flex flex-col gap-6">
      <Seo title="Account settings" noIndex />
      <h1 className="text-h2 font-extrabold uppercase font-condensed">Settings</h1>

      {profile.isPending ? (
        <Skeleton className="h-60 w-full" />
      ) : profile.isError ? (
        <p role="alert" className="text-danger">
          {errorMessage(profile.error)}
        </p>
      ) : (
        <>
          <Card title="Your details">
            <ProfileForm profile={profile.data} />
          </Card>
          <Card
            title="Password"
            description={
              googleOnly
                ? "You sign in with Google, so there's no password to change here."
                : "Changing your password logs you out on every device."
            }
          >
            {googleOnly ? null : <PasswordForm />}
          </Card>
        </>
      )}
    </div>
  );
}
