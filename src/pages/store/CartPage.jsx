import { useRef } from "react";
import { useNavigate } from "react-router";
import { ShoppingBag } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { CartLineItem } from "../../features/cart/components/CartLineItem";
import { CartSummary } from "../../features/cart/components/CartSummary";
import { useGuestCart } from "../../features/cart/guest-cart";
import { blocksCheckout } from "../../features/cart/lib/line-check";
import { useLineChecks } from "../../features/cart/quotes";
import { useCartActions } from "../../features/cart/useCartActions";

/** /cart — review lines (with live price/stock checks), coupon, delivery estimate, checkout. */
export default function CartPage() {
  const navigate = useNavigate();
  const { cart, remove, setQuantity } = useCartActions();
  const { checks, checking } = useLineChecks(cart.lines, { enabled: cart.lines.length > 0 });
  const refreshGuestLine = useGuestCart((s) => s.refreshLine);
  const headingRef = useRef(/** @type {HTMLHeadingElement|null} */ (null));

  // The removed line took keyboard focus with it: park focus on the heading instead of <body>.
  const removeLine = (line) => {
    remove(line);
    headingRef.current?.focus();
  };

  // Lines that can no longer be bought don't count towards the estimate.
  const liveSubtotal = cart.lines.reduce((sum, l) => {
    const check = checks.get(l.variantId);
    if (check?.status === "unavailable") return sum;
    return sum + (check?.livePrice ?? l.unitPrice) * l.quantity;
  }, 0);
  const blocked = cart.lines.some((l) =>
    blocksCheckout(checks.get(l.variantId) ?? { status: "ok" }),
  );

  const goToCheckout = () => {
    // Guest lines carry a price snapshot: bring them up to date before checkout shows totals.
    if (cart.source === "guest") {
      for (const line of cart.lines) {
        const check = checks.get(line.variantId);
        if (check?.livePrice != null)
          refreshGuestLine(line.variantId, {
            unitPrice: check.livePrice,
            maxQuantity: check.stock,
          });
      }
    }
    navigate("/checkout");
  };

  let body;
  if (cart.isLoading) {
    body = (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">Loading your cart</span>
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-24" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (cart.isError) {
    body = <ErrorState error={cart.error} onRetry={() => cart.refetch()} />;
  } else if (cart.lines.length === 0) {
    body = (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Browse authentic supplements from 21 trusted brands."
        action={<Button to="/shop">Shop all products</Button>}
      />
    );
  }

  return (
    <div className="page-container pb-16">
      <Seo title="Your cart" noIndex />
      <Breadcrumbs
        className="pt-4 md:pt-6"
        items={[{ label: "Home", to: "/" }, { label: "Cart" }]}
      />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-h1 font-extrabold uppercase font-condensed outline-none md:text-5xl"
      >
        Your cart{cart.count ? ` (${cart.count})` : ""}
      </h1>

      {body ?? (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
          <section aria-label="Items">
            <ul className="border-t border-line">
              {cart.lines.map((line) => (
                <CartLineItem
                  key={line.variantId}
                  line={line}
                  check={checks.get(line.variantId)}
                  onQuantity={(q) => setQuantity(line, q)}
                  onRemove={() => removeLine(line)}
                />
              ))}
            </ul>
            <Button to="/shop" variant="link" className="mt-5">
              Continue shopping
            </Button>
          </section>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartSummary
              subtotal={liveSubtotal}
              blocked={blocked}
              onCheckout={goToCheckout}
              checking={checking}
            />
          </div>
        </div>
      )}
    </div>
  );
}
