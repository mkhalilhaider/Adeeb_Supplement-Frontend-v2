import { toast } from "sonner";
import { errorMessage } from "./api/errors";

/**
 * Toast helpers with consistent wording. Use toasts for confirmations of background actions
 * ("Added to cart"); form errors belong inline next to the field, not in a toast.
 */
export const notify = {
  success: (message, options) => toast.success(message, options),
  info: (message, options) => toast(message, options),
  /** Accepts an Error/ApiError or a string. Cancelled requests show nothing. */
  error: (errorOrMessage, options) => {
    const message =
      typeof errorOrMessage === "string" ? errorOrMessage : errorMessage(errorOrMessage);
    if (message) toast.error(message, options);
  },
  /** Action with undo, e.g. "Removed from cart · Undo". */
  undoable: (message, onUndo) =>
    toast(message, { action: { label: "Undo", onClick: onUndo }, duration: 6000 }),
};
