import { notify } from "../../lib/notify";

/**
 * The message after tapping a heart: "Saved · View" or "Removed · Undo". Loaded on the first
 * tap (not with the page), since most visits never use it.
 * @param {boolean} saved  true when the product was just saved
 * @param {{ view: () => void, undo: () => void }} actions
 */
export function wishlistToast(saved, { view, undo }) {
  if (saved) notify.success("Saved to your wishlist", { action: { label: "View", onClick: view } });
  else notify.undoable("Removed from your wishlist", undo);
}
