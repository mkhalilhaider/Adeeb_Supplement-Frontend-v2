import { lazy, Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Link2, Upload } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { cloudinaryVideoPoster } from "../../lib/cloudinary";
import { notify } from "../../lib/notify";
import {
  adminKeys,
  createReel,
  deleteReel,
  fetchAdminReels,
  fetchReelSignature,
  reorderReels,
  updateReel,
} from "../../features/admin/api";
import { AdminHeader, Panel, Toggle } from "../../features/admin/ui";
import { adminQuery } from "../../features/admin/format";

const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

const MAX_VIDEO = 100 * 1024 * 1024;

/** Straight-to-Cloudinary upload with progress (the signature comes from the backend). */
function uploadToCloudinary(file, sig, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", sig.timestamp);
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sig.uploadUrl);
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) resolve(body.secure_url);
        else reject(new Error(body?.error?.message || "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection"));
    xhr.send(form);
  });
}

function AddReel({ onAdded }) {
  const [label, setLabel] = useState("Customer review");
  const [link, setLink] = useState("");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const add = async (src) => {
    await createReel({ src, label: label.trim() || undefined, isActive: true });
    notify.success("Reel added");
    onAdded();
  };

  const pickVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) return setError("Choose a video file");
    if (file.size > MAX_VIDEO) return setError("Videos must be 100 MB or smaller");
    setError("");
    setProgress(0);
    try {
      const sig = await fetchReelSignature();
      const url = await uploadToCloudinary(file, sig, setProgress);
      await add(url);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProgress(null);
    }
  };

  const addLink = async (e) => {
    e.preventDefault();
    const url = link.trim();
    if (!/^https:\/\/\S+$/.test(url))
      return setError("Paste a full https:// link (Instagram reel or .mp4)");
    setPending(true);
    setError("");
    try {
      await add(url);
      setLink("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Panel title="Add a reel">
      <div className="flex flex-col gap-4">
        <label className="flex max-w-sm flex-col gap-1.5 text-small font-medium">
          Caption
          <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-small font-semibold text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
            <Upload aria-hidden="true" className="size-4" />
            {progress != null ? `Uploading ${progress}%` : "Upload video"}
            <input
              type="file"
              accept="video/*"
              onChange={pickVideo}
              disabled={progress != null}
              className="sr-only"
            />
          </label>
          <span className="text-small text-ink-3">or</span>
          <form onSubmit={addLink} className="flex flex-1 flex-wrap gap-2">
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Instagram reel or video link"
              aria-label="Video link"
              leading={<Link2 aria-hidden="true" className="size-4" />}
              className="min-w-60 flex-1"
            />
            <Button type="submit" variant="outline" loading={pending}>
              Add link
            </Button>
          </form>
        </div>
        {progress != null && (
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-ink transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
        <p className="text-small text-ink-3">
          Instagram links only work when an Instagram token for the same account is set on the
          backend.
        </p>
      </div>
    </Panel>
  );
}

/** /admin/reels — homepage customer videos. */
export default function ReelsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: adminKeys.reels,
    queryFn: ({ signal }) => fetchAdminReels({ signal }),
    ...adminQuery,
  });
  const [removing, setRemoving] = useState(/** @type {any} */ (null));
  const [pending, setPending] = useState(false);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.reels });
    queryClient.invalidateQueries({ queryKey: ["reels"] });
  };

  const reels = [...(query.data?.reels ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const patch = async (reel, body) => {
    try {
      await updateReel(reel._id, body);
      refresh();
    } catch (err) {
      notify.error(err);
    }
  };

  const move = async (index, dir) => {
    const next = [...reels];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    try {
      await reorderReels(next.map((r, i) => ({ _id: r._id, order: i + 1 })));
      refresh();
    } catch (err) {
      notify.error(err);
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      await deleteReel(removing._id);
      setRemoving(null);
      refresh();
    } catch (err) {
      notify.error(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <AdminHeader
        title="Reels"
        description="Customer videos on the homepage. The homepage shows the newest first, so the order below only breaks ties."
      />
      <AddReel onAdded={refresh} />

      <div className="mt-6">
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton className="h-60" />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {reels.map((reel, i) => {
              const poster = cloudinaryVideoPoster(reel.src, { w: 300 }) ?? reel.thumbnailUrl;
              return (
                <li
                  key={reel._id}
                  className="flex flex-col gap-2 rounded-sm border border-line bg-surface p-2"
                >
                  <div className="relative aspect-[9/16] overflow-hidden rounded-sm bg-night">
                    {poster ? (
                      <img src={poster} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <video
                        src={reel.src}
                        preload="metadata"
                        muted
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <Input
                    defaultValue={reel.label}
                    aria-label="Caption"
                    className="!h-9 text-small"
                    onBlur={(e) =>
                      e.target.value !== reel.label && patch(reel, { label: e.target.value })
                    }
                  />
                  <Toggle
                    checked={reel.isActive}
                    onChange={(isActive) => patch(reel, { isActive })}
                    label="Shown"
                  />
                  <div className="flex items-center justify-between">
                    <span className="flex gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        aria-label="Move earlier"
                        className="flex size-8 items-center justify-center rounded-sm hover:bg-shelf disabled:opacity-30"
                      >
                        <ArrowUp aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={i === reels.length - 1}
                        onClick={() => move(i, 1)}
                        aria-label="Move later"
                        className="flex size-8 items-center justify-center rounded-sm hover:bg-shelf disabled:opacity-30"
                      >
                        <ArrowDown aria-hidden="true" className="size-4" />
                      </button>
                    </span>
                    <button
                      type="button"
                      className="text-small text-danger underline"
                      onClick={() => setRemoving(reel)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {removing && (
        <Suspense fallback={null}>
          <ConfirmDialog
            open
            onOpenChange={(o) => !o && setRemoving(null)}
            title="Delete this reel?"
            description="It disappears from the homepage. The video file itself stays in Cloudinary."
            confirmLabel="Delete reel"
            pending={pending}
            onConfirm={remove}
          />
        </Suspense>
      )}
    </div>
  );
}
