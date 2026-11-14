import { useEffect } from "react";
import { Toaster } from "sonner";
import { markToasterReady } from "../../lib/notify";

/** The actual toast container (loaded lazily by DeferredToaster). */
export default function ToasterHost() {
  useEffect(() => {
    markToasterReady();
  }, []);

  return (
    <Toaster
      position="bottom-center"
      visibleToasts={3}
      // Confirmations are quick to read; errors stay a little longer.
      duration={2800}
      // Sit above the phone tab bar / sticky buy bar.
      offset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-md !border !border-line !bg-surface !text-ink !shadow-overlay !font-sans",
          description: "!text-ink-2",
        },
      }}
    />
  );
}
