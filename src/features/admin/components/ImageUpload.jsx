import { useId, useRef, useState } from "react";
import { CircleX, ImagePlus } from "lucide-react";
import { CloudImage } from "../../../components/ui/CloudImage";
import { Spinner } from "../../../components/ui/Spinner";
import { errorMessage } from "../../../lib/api/errors";
import { cn } from "../../../lib/cn";
import { uploadImage } from "../api";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Pick an image → uploaded to Cloudinary through the backend → { url, publicId }.
 * (The backend has no delete-image endpoint; replaced files stay in Cloudinary.)
 *
 * @param {{ value: {url: string, publicId?: string}|null, onChange: (v: any) => void, label: string, compact?: boolean }} props
 */
export function ImageUpload({ value, onChange, label, compact = false }) {
  const id = useId();
  const input = useRef(/** @type {HTMLInputElement|null} */ (null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file");
    if (file.size > MAX_BYTES) return setError("Images must be 5 MB or smaller");
    setBusy(true);
    setError("");
    try {
      const { image } = await uploadImage(file);
      onChange(image);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const size = compact ? "size-16" : "size-28";
  return (
    <div className="flex flex-col gap-1">
      <span className="sr-only" id={`${id}-label`}>
        {label}
      </span>
      <div
        className={cn("relative rounded-sm border border-dashed border-line-strong bg-shelf", size)}
      >
        {value?.url ? (
          <CloudImage
            src={value.url}
            alt=""
            ratio={null}
            fit="contain"
            className="size-full p-1"
            sizes="112px"
          />
        ) : null}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          aria-labelledby={`${id}-label`}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-sm text-ink-3 hover:bg-ink/5 hover:text-ink",
            value?.url && "opacity-0 hover:opacity-100 focus-visible:opacity-100",
          )}
          title={value?.url ? "Replace image" : "Upload image"}
        >
          {busy ? <Spinner /> : <ImagePlus aria-hidden="true" className="size-5" />}
        </button>
        {value?.url && !busy && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-line-strong bg-surface hover:border-ink"
            aria-label={`Remove ${label}`}
          >
            <CircleX aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={pick}
        tabIndex={-1}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="max-w-40 text-[12px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
