import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Label + control + hint + error, wired for assistive tech. The child receives the ids it needs
 * through a render function so any control (input, select, custom) can be used:
 *
 *   <Field label="Phone" hint="We'll call to confirm" error={errors.phone?.message} required>
 *     {(field) => <Input {...field} {...register("phone")} />}
 *   </Field>
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {boolean} [props.required]   Shows a marker; validation itself lives in the schema
 * @param {boolean} [props.hideLabel]  Visually hidden but still announced
 * @param {(field: { id: string, "aria-describedby"?: string, "aria-invalid"?: boolean, required?: boolean }) => import("react").ReactNode} props.children
 */
export function Field({ label, hint, error, required, hideLabel, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-small font-medium text-ink", hideLabel && "sr-only")}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-brand-ink">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required: required || undefined,
      })}
      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-small text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-small text-ink-3">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
