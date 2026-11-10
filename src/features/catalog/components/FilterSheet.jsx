import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Sheet } from "../../../components/ui/Sheet";
import { FilterPanel } from "./FilterPanel";
import { SortSelect } from "./ListingControls";

/** Mobile filters: changes are a draft until "Show results" (no request per tap). */
export default function FilterSheet({ open, onOpenChange, listing }) {
  const [draft, setDraft] = useState(listing.state);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter & sort"
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setDraft({
                ...listing.state,
                category: listing.base.category,
                brand: listing.base.brand,
                min: undefined,
                max: undefined,
                featured: false,
              })
            }
          >
            Reset
          </Button>
          <Button
            fullWidth
            onClick={() => {
              listing.update(draft);
              onOpenChange(false);
            }}
          >
            Show results
          </Button>
        </div>
      }
    >
      <div className="mb-5 border-b border-line pb-5">
        <SortSelect
          id="sort-sheet"
          value={draft.sort}
          onChange={(sort) => setDraft({ ...draft, sort })}
        />
      </div>
      <FilterPanel
        idPrefix="sheet"
        state={draft}
        base={listing.base}
        taxonomy={listing.taxonomy}
        onChange={(patch) => setDraft({ ...draft, ...patch })}
      />
    </Sheet>
  );
}
