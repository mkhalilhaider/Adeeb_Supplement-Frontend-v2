import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { IconButton } from "../../components/ui/Button";
import { SearchCombobox } from "./SearchCombobox";

/** Full-screen search for phones: keyboard opens straight away, suggestions fill the screen. */
export function SearchOverlay({ open, onOpenChange }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-paper px-4 pt-[max(0.75rem,env(safe-area-inset-top))] outline-none"
        >
          <div className="flex items-center justify-between pb-3">
            <RadixDialog.Title className="label-mono text-ink-3">Search</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton label="Close search" size="sm">
                <X aria-hidden="true" className="size-5" />
              </IconButton>
            </RadixDialog.Close>
          </div>
          <div className="min-h-0 flex-1">
            <SearchCombobox variant="overlay" focusOnMount onDone={() => onOpenChange(false)} />
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
