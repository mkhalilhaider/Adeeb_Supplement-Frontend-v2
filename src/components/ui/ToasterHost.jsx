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
