import { errorMessage } from "./api/errors";

/**
 * Toast helpers with consistent wording. Use toasts for confirmations of background actions
 * ("Added to cart"); form errors belong inline next to the field, not in a toast.
 *
 * The toast library is loaded lazily (it isn't needed for first paint). Calls made before it
 * is ready wait for it, so no message is ever lost.
 */
export const NEED_TOASTER_EVENT = "adeeb:need-toaster";

let resolveReady;
const toasterReady = new Promise((resolve) => {
  resolveReady = resolve;
});

/** Called by the toast container once it is mounted. */
export function markToasterReady() {
  resolveReady();
}

async function show(kind, message, options) {
  window.dispatchEvent(new Event(NEED_TOASTER_EVENT));
  const [{ toast }] = await Promise.all([import("sonner"), toasterReady]);
  if (kind === "plain") toast(message, options);
  else toast[kind](message, options);
}

export const notify = {
  success: (message, options) => show("success", message, options),
  info: (message, options) => show("plain", message, options),
  /** Accepts an Error/ApiError or a string. Cancelled requests show nothing. */
  error: (errorOrMessage, options) => {
    const message =
      typeof errorOrMessage === "string" ? errorOrMessage : errorMessage(errorOrMessage);
    if (message) show("error", message, options);
  },
  /** Action with undo, e.g. "Removed from cart · Undo". */
  undoable: (message, onUndo) =>
    show("plain", message, { action: { label: "Undo", onClick: onUndo }, duration: 6000 }),
};
