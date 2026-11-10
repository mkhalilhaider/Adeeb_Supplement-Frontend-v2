import { ShoppingBag } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Sheet } from "../../../components/ui/Sheet";
import { EmptyState } from "../../../components/ui/States";
import { formatPrice } from "../../../lib/format";
import { useCartUi } from "../cart-ui";
import { useLineChecks } from "../quotes";
import { useCartActions } from "../useCartActions";
import { CartLineItem } from "./CartLineItem";

/**
 * Slide-in cart opened after "Add to cart": a quick look and the way to checkout, without
 * leaving the page. Side panel on desktop, bottom sheet on phones.
 */
export default function CartDrawer() {
  const { drawerOpen, setDrawerOpen, lastAdded } = useCartUi();
  const { cart, remove, setQuantity } = useCartActions();
  const { checks } = useLineChecks(cart.lines, { enabled: drawerOpen });
  const close = () => setDrawerOpen(false);

  return (
    <Sheet
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      title={cart.count ? `Your cart (${cart.count})` : "Your cart"}
      footer={
        cart.lines.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-ink-2">Subtotal</span>
              <span className="text-h3 font-bold tabular-nums">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="-mt-2 text-small text-ink-3">Delivery and discounts at checkout.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" to="/cart" onClick={close}>
                View cart
              </Button>
              <Button to="/checkout" onClick={close}>
                Checkout
              </Button>
            </div>
          </div>
        )
      }
    >
      {cart.lines.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Find your next tub of protein, creatine or pre-workout."
          action={
            <Button to="/shop" onClick={close}>
              Shop all products
            </Button>
          }
        />
      ) : (
        <ul aria-label="Items in your cart" className="-mt-4">
          {cart.lines.map((line) => (
            <CartLineItem
              key={line.variantId}
              line={line}
              compact
              check={checks.get(line.variantId)}
              highlight={line.variantId === lastAdded}
              onQuantity={(q) => setQuantity(line, q)}
              onRemove={() => remove(line)}
            />
          ))}
        </ul>
      )}
    </Sheet>
  );
}
