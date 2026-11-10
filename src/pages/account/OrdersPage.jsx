import { useState } from "react";
import { Package } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { OrderCard } from "../../features/account/components/OrderCard";
import { useMyOrders } from "../../features/account/queries";

const PAGE = 10;

/** /account/orders — every order placed while logged in (the backend returns them all). */
export default function OrdersPage() {
  const orders = useMyOrders();
  const [shown, setShown] = useState(PAGE);
  const list = orders.data ?? [];

  let body;
  if (orders.isPending) {
    body = (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">Loading orders</span>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  } else if (orders.isError) {
    body = <ErrorState error={orders.error} onRetry={() => orders.refetch()} />;
  } else if (list.length === 0) {
    body = (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="Orders you place while logged in show up here. For an order placed as a guest, use Track order."
        action={<Button to="/shop">Start shopping</Button>}
      />
    );
  } else {
    body = (
      <>
        <ul className="flex flex-col gap-3">
          {list.slice(0, shown).map((order) => (
            <li key={order._id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
        {shown < list.length && (
          <Button variant="outline" className="self-center" onClick={() => setShown(shown + PAGE)}>
            Show more orders ({list.length - shown} more)
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Seo title="My orders" noIndex />
      <h1 className="text-h2 font-extrabold uppercase font-condensed">
        Orders{list.length ? ` (${list.length})` : ""}
      </h1>
      {body}
    </div>
  );
}
