import { ShoppingBag } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useSession } from "../../features/auth/session-store";
import { useCart } from "../../features/cart/useCart";
import { CheckoutView } from "../../features/checkout/CheckoutView";

/** /checkout — waits for the session and cart, then shows the one-page checkout. */
export default function CheckoutPage() {
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const cart = useCart();

  let body;
  if (status === "unknown" || cart.isLoading) {
    body = (
      <div role="status" className="page-container grid gap-8 pt-10 lg:grid-cols-[1fr_26rem]">
        <span className="sr-only">Loading checkout</span>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  } else if (cart.isError) {
    body = (
      <div className="page-container py-16">
        <ErrorState error={cart.error} onRetry={() => cart.refetch()} />
      </div>
    );
  } else if (cart.lines.length === 0) {
    body = (
      <div className="page-container py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add something to your cart, then come back to check out."
          action={<Button to="/shop">Shop all products</Button>}
        />
      </div>
    );
  } else {
    body = <CheckoutView cart={cart} user={user} loggedIn={status === "authenticated"} />;
  }

  return (
    <>
      <Seo title="Checkout" noIndex />
      {body}
    </>
  );
}
