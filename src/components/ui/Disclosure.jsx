import * as RadixAccordion from "@radix-ui/react-accordion";
import * as RadixTabs from "@radix-ui/react-tabs";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Accordion of sections separated by hairlines (product details, FAQs, mobile filters).
 * @param {{ items: { value: string, title: string, content: import("react").ReactNode }[], type?: "single"|"multiple", defaultValue?: string|string[] }} props
 */
export function Accordion({ items, type = "multiple", defaultValue, className }) {
  return (
    <RadixAccordion.Root
      type={type}
      defaultValue={defaultValue ?? (type === "multiple" ? [] : undefined)}
      collapsible={type === "single" ? true : undefined}
      className={cn("border-t border-line", className)}
    >
      {items.map((item) => (
        <RadixAccordion.Item key={item.value} value={item.value} className="border-b border-line">
          <RadixAccordion.Header>
            <RadixAccordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left font-semibold">
              {item.title}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-ink-2 transition-transform duration-(--duration-base) group-data-[state=open]:rotate-180"
              />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="pb-5 text-ink-2">
            {item.content}
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}

/**
 * Underlined tabs (desktop product info, account sections). Arrow keys switch tabs.
 * @param {{ tabs: { value: string, label: string, content: import("react").ReactNode }[], defaultValue?: string, label: string }} props
 */
export function Tabs({ tabs, defaultValue, label, className }) {
  return (
    <RadixTabs.Root defaultValue={defaultValue ?? tabs[0]?.value} className={className}>
      <RadixTabs.List
        aria-label={label}
        className="flex gap-6 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className="-mb-px shrink-0 border-b-2 border-transparent py-3 font-semibold text-ink-3 transition-colors hover:text-ink data-[state=active]:border-ink data-[state=active]:text-ink"
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.value} value={tab.value} className="pt-5 outline-none">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
