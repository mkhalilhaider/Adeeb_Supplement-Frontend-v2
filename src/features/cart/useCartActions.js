import { notify } from "../../lib/notify";
import { useCart } from "./useCart";

/** Cart line actions with consistent feedback: remove offers Undo, failures show a message. */
export function useCartActions() {
  const cart = useCart();

  const remove = async (line) => {
    await cart.remove(line.variantId);
    notify.undoable(`Removed ${line.name}`, () => {
      cart.add(line, line.quantity).catch((error) => notify.error(error));
    });
  };

  const setQuantity = (line, quantity) => cart.setQuantity(line.variantId, quantity);

  return { cart, remove, setQuantity };
}
