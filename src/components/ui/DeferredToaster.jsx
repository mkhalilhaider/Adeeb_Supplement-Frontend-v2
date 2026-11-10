import { lazy, Suspense, useEffect, useState } from "react";
import { NEED_TOASTER_EVENT } from "../../lib/notify";

// The toast library isn't needed for first paint, so it loads when the browser is idle — or
// straight away if something needs to show a message first.
const ToasterHost = lazy(() => import("./ToasterHost"));

export function DeferredToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return undefined;
    const mount = () => setMounted(true);
    window.addEventListener(NEED_TOASTER_EVENT, mount, { once: true });
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(mount, { timeout: 4000 })
      : window.setTimeout(mount, 2500);
    return () => {
      window.removeEventListener(NEED_TOASTER_EVENT, mount);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [mounted]);

  return mounted ? (
    <Suspense fallback={null}>
      <ToasterHost />
    </Suspense>
  ) : null;
}
