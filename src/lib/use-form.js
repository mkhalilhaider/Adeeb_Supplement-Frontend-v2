import { useCallback, useRef, useState } from "react";

/**
 * Minimal form state for the storefront's forms (checkout, auth, account) — a few hundred
 * bytes instead of a form library on pages that must load fast.
 *
 * - `field(name)` gives value/onChange/onBlur/ref to spread on an input.
 * - Validation is one pure function `(values) => ({ field: "message" })`, passed to
 *   `handleSubmit`. Errors appear on submit, then update as the shopper types.
 * - The first invalid field (in page order) gets focus on a failed submit.
 *
 * @template {Record<string, string>} T
 * @param {() => T} init  Initial values (called once)
 */
export function useForm(init) {
  const [values, setValues] = useState(init);
  const [errors, setErrors] = useState(/** @type {Partial<Record<keyof T, string>>} */ ({}));
  const latest = useRef(values);
  const elements = useRef(/** @type {Record<string, HTMLElement|null>} */ ({}));
  const validator = useRef(/** @type {null | ((v: T) => Record<string, string>)} */ (null));

  /** Set one value; after a submit attempt, re-check the form as it changes. */
  const set = useCallback((name, value) => {
    latest.current = { ...latest.current, [name]: value };
    setValues(latest.current);
    if (validator.current) setErrors(clean(validator.current(latest.current)));
  }, []);

  /** Props for an input bound to `name`. */
  const field = (name, { onBlur } = {}) => ({
    name,
    value: values[name] ?? "",
    onChange: (event) => set(name, event.target.value),
    onBlur,
    ref: (el) => {
      elements.current[name] = el;
    },
    "aria-invalid": errors[name] ? true : undefined,
  });

  /**
   * @param {(v: T) => Record<string, string>} validate
   * @param {(v: T) => void | Promise<void>} onValid
   */
  const handleSubmit = (validate, onValid) => (event) => {
    event?.preventDefault();
    validator.current = validate;
    const found = clean(validate(latest.current));
    setErrors(found);
    const invalid = Object.keys(found)
      .map((name) => elements.current[name])
      .filter(Boolean)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }
    if (Object.keys(found).length === 0) return onValid(latest.current);
  };

  const getValue = useCallback((name) => latest.current[name], []);

  return { values, errors, field, set, getValue, handleSubmit };
}

/** Drop empty messages so `Object.keys(errors)` means "fields with a problem". */
function clean(errors) {
  return Object.fromEntries(Object.entries(errors ?? {}).filter(([, message]) => message));
}
