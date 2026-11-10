import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button, IconButton } from "./Button";

/**
 * Centered modal for short, focused tasks. Traps focus, closes on Esc / backdrop, and returns
 * focus to the trigger. On phones it sits near the bottom for thumb reach.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string} props.title
 * @param {import("react").ReactNode} [props.description]
 * @param {import("react").ReactNode} [props.footer]
 * @param {"sm"|"md"|"lg"} [props.size]
 */
export function Dialog({ open, onOpenChange, title, description, footer, size = "sm", children }) {
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=closed]:animate-[fade-in_150ms_reverse] data-[state=open]:animate-[fade-in_150ms]" />
        <RadixDialog.Content
          className={cn(
            "fixed inset-x-3 bottom-3 z-50 mx-auto flex max-h-[85dvh] flex-col rounded-lg bg-surface shadow-overlay outline-none",
            "sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2",
            "data-[state=open]:animate-[dialog-in_200ms_var(--ease-out-soft)]",
            widths[size],
          )}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-4 pb-3">
            <div>
              <RadixDialog.Title className="text-h3 font-semibold">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-small text-ink-2">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Close" size="sm" className="-mr-2">
                <X aria-hidden="true" className="size-5" />
              </IconButton>
            </RadixDialog.Close>
          </div>
          {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/**
 * "Are you sure?" for destructive or irreversible actions. The confirm button shows a spinner
 * while `pending`, and the dialog can't be dismissed mid-request.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  pending = false,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "secondary"}
            loading={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
