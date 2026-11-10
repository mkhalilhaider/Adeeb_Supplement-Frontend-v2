import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import { Field } from "../../../components/ui/Field";
import { Input, Textarea } from "../../../components/ui/Input";
import { ApiError, errorMessage } from "../../../lib/api/errors";
import { cn } from "../../../lib/cn";
import { notify } from "../../../lib/notify";
import { createReview } from "../api";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** 1–5 stars as native radios (arrow keys work; each star is announced with its meaning). */
function StarInput({ value, onChange, error }) {
  return (
    <fieldset aria-describedby={error ? "rating-error" : undefined}>
      <legend className="text-small font-medium">
        Your rating<span className="ml-0.5 text-brand-ink">*</span>
      </legend>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer rounded-sm p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink"
          >
            <input
              type="radio"
              name="rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <span className="sr-only">
              {n} {n === 1 ? "star" : "stars"} — {LABELS[n]}
            </span>
            <Star
              aria-hidden="true"
              className={cn(
                "size-8 transition-colors duration-(--duration-fast)",
                n <= value ? "fill-brand text-brand" : "text-line-strong",
              )}
            />
          </label>
        ))}
        <span className="ml-2 text-small text-ink-2" aria-hidden="true">
          {LABELS[value]}
        </span>
      </div>
      {error && (
        <p id="rating-error" role="alert" className="mt-1.5 text-small text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Review form for one product of a confirmed order. Verified-purchase reviews only; one per
 * product (the backend answers 409 for a second one).
 *
 * @param {{ open: boolean, onOpenChange: (o: boolean) => void, item: any, orderId: string, onDone: (productId: string) => void }} props
 */
export default function WriteReviewDialog({ open, onOpenChange, item, orderId, onDone }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;
    if (!rating) {
      setRatingError("Choose a star rating");
      return;
    }
    setPending(true);
    setError("");
    try {
      await createReview({
        productId: item.productId,
        orderId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["reviews", item.productId] });
      notify.success("Thanks for your review!");
      onDone(item.productId);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        notify.info("You've already reviewed this product.");
        onDone(item.productId);
        onOpenChange(false);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title="Write a review"
      description={item?.productName}
      size="md"
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <StarInput
          value={rating}
          onChange={(n) => {
            setRating(n);
            setRatingError("");
          }}
          error={ratingError}
        />
        <Field label="Headline" hint="Optional">
          {(f) => (
            <Input
              {...f}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          )}
        </Field>
        <Field label="Your review" hint="Optional — taste, mixability, results">
          {(f) => (
            <Textarea
              {...f}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
            />
          )}
        </Field>
        {error && (
          <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-small text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Post review
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
