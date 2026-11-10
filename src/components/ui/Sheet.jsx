import { useRef } from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useIsDesktop } from "../../lib/useMediaQuery";
import { IconButton } from "./Button";

/**
 * Panel that slides in: a drag-to-dismiss bottom sheet on phones, a right-hand side panel on
 * tablet/desktop. Used for filters, variant picking, the cart and the mobile menu.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string} props.title
 * @param {import("react").ReactNode} [props.description]
 * @param {import("react").ReactNode} [props.footer]   Sticky action area (e.g. "Show 24 results")
 * @param {"left"|"right"} [props.side]               Desktop side; menus use "left"
 * @param {boolean} [props.forceBottom]               Bottom sheet on every screen size
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  side = "right",
  forceBottom = false,
  children,
}) {
  const isDesktop = useIsDesktop();
  const bottom = forceBottom || !isDesktop;
  const direction = bottom ? "bottom" : side;
  // Vaul doesn't hand focus back to the opener on close, so keyboard users would land at the top
  // of the page. Remember the opener when the sheet takes focus, and restore it on close.
  const openerRef = useRef(null);
  const rememberOpener = () => {
    const el = document.activeElement;
    openerRef.current = el instanceof HTMLElement && el !== document.body ? el : null;
  };
  const restoreFocus = (event) => {
    const opener = openerRef.current;
    if (opener?.isConnected) {
      event.preventDefault();
      opener.focus({ preventScroll: true });
    }
  };

  return (
    // autoFocus: Vaul defaults to false, which skips moving focus into the sheet — then Radix
    // never starts its focus trap and Tab reaches the page behind. Our sheets open with the
    // Close button first (not a text field), so this never pops the phone keyboard.
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={direction} autoFocus>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Drawer.Content
          onOpenAutoFocus={rememberOpener}
          onCloseAutoFocus={restoreFocus}
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed z-50 flex flex-col bg-surface outline-none",
            bottom
              ? "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-lg shadow-sheet"
              : cn(
                  "inset-y-0 w-full max-w-md shadow-overlay",
                  side === "right" ? "right-0" : "left-0",
                ),
          )}
        >
          {bottom && (
            <div
              aria-hidden="true"
              className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line-strong"
            />
          )}
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 pt-3 pb-3 md:px-5">
            <div>
              <Drawer.Title className="text-h3 font-semibold">{title}</Drawer.Title>
              {description && (
                <Drawer.Description className="mt-0.5 text-small text-ink-2">
                  {description}
                </Drawer.Description>
              )}
            </div>
            <Drawer.Close asChild>
              <IconButton label="Close" size="sm" className="-mr-2">
                <X aria-hidden="true" className="size-5" />
              </IconButton>
            </Drawer.Close>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5">
            {children}
          </div>
          {footer && (
            <div className="border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-5">
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
