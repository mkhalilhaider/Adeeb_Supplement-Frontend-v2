import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Volume2, VolumeX } from "lucide-react";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { site } from "../../config/site";
import { cloudinaryVideoPoster } from "../../lib/cloudinary";
import { fetchReels } from "./api";
import { Slider } from "./Slider";

const isCloudinaryVideo = (src) => typeof src === "string" && src.includes("/video/upload/");

/** Mobile-width MP4 from Cloudinary (originals can be large); other sources as they are. */
function videoUrl(src) {
  if (!isCloudinaryVideo(src)) return src;
  return src.replace("/video/upload/", "/video/upload/f_auto:video,q_auto,w_540/");
}

/**
 * One reel. Shows its poster (or a plain tile) until it is at least 60% on screen; only then
 * does the video load. Plays muted while visible, pauses when scrolled away. Tap for sound.
 */
function Reel({ reel, onBroken }) {
  const ref = useRef(/** @type {HTMLDivElement|null} */ (null));
  const videoRef = useRef(/** @type {HTMLVideoElement|null} */ (null));
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const on = entry.intersectionRatio >= 0.6;
        setVisible(on);
        if (on) setLoaded(true);
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Autoplay (muted) only while visible, and never for people who asked for less motion.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (visible && !reduceMotion) video.play().catch(() => {});
    else video.pause();
  }, [visible, loaded, reduceMotion]);

  const poster = cloudinaryVideoPoster(reel.src) ?? reel.thumbnailUrl;
  const label = reel.label || "Customer review";

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    if (video.paused) video.play().catch(() => {});
  };

  return (
    <div ref={ref} className="relative aspect-[9/16] overflow-hidden rounded-md bg-night">
      {poster && !playing && (
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {loaded && (
        // Customer clips come from Instagram without caption files; they start muted and the
        // label names them.
        // eslint-disable-next-line jsx-a11y/media-has-caption -- no caption files exist for these clips
        <video
          ref={videoRef}
          src={videoUrl(reel.src)}
          poster={poster}
          muted={muted}
          playsInline
          loop
          preload="none"
          onPlaying={() => setPlaying(true)}
          onError={onBroken}
          aria-label={label}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {!playing && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-paper/90"
        >
          <Play className="size-10 drop-shadow" />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-night/80 to-transparent p-3 pt-10">
        <p className="label-caps text-paper">{label}</p>
        {loaded && (
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? `Play ${label} with sound` : `Mute ${label}`}
            aria-pressed={!muted}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-night/70 text-paper hover:bg-night"
          >
            {muted ? (
              <VolumeX aria-hidden="true" className="size-4" />
            ) : (
              <Volume2 aria-hidden="true" className="size-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Customer video reviews (the backend's reels: real video files, no Instagram embeds). The
 * list loads when the section is near; each video only when it is on screen.
 */
export default function ReelsSection() {
  const reels = useQuery({
    queryKey: ["reels"],
    queryFn: ({ signal }) => fetchReels({ signal }),
    staleTime: 10 * 60_000,
  });
  const [broken, setBroken] = useState(() => new Set());
  const list = (reels.data ?? []).filter((r) => r.src && !broken.has(r._id));
  if (reels.isPending || list.length === 0) return null;

  return (
    <section aria-labelledby="reels-heading" className="page-container">
      <Slider
        label="Customer video reviews"
        header={
          <SectionHeading
            id="reels-heading"
            eyebrow="From our customers"
            title="Real reviews on video"
          />
        }
        items={list}
        getKey={(r) => r._id}
        itemClassName="w-[72%] sm:w-[40%] md:w-[calc((100%-36px)/4)] xl:w-[calc((100%-48px)/5)]"
        renderItem={(reel) => (
          <Reel reel={reel} onBroken={() => setBroken((s) => new Set(s).add(reel._id))} />
        )}
      />
      <a
        href={site.social.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-small font-semibold underline"
      >
        Follow us on Instagram
      </a>
    </section>
  );
}
