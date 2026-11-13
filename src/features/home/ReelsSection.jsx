import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Play, Volume2, VolumeX } from "lucide-react";
import { InstagramIcon } from "../../components/ui/BrandIcons";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { site } from "../../config/site";
import { cloudinaryVideoPoster } from "../../lib/cloudinary";
import { fetchReels } from "./api";
import { Slider } from "./Slider";

const INSTAGRAM_HANDLE = site.social.instagram.replace(/\/+$/, "").split("/").pop();

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
    <div
      ref={ref}
      className="group/reel relative aspect-[9/16] overflow-hidden rounded-[28px] bg-night"
    >
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
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-night/70 to-transparent"
      />
      {/* The whole reel is the sound switch: one tap turns sound on (browsers block sound on
          hover until the visitor clicks, and phones have no hover). */}
      <button
        type="button"
        onClick={toggleSound}
        disabled={!loaded}
        aria-label={muted ? `Play ${label} with sound` : `Mute ${label}`}
        aria-pressed={!muted}
        className="absolute inset-0 flex items-end justify-between p-3.5 text-left focus-visible:outline-offset-[-4px]"
      >
        {muted && loaded && (
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden items-center justify-center bg-night/25 opacity-0 transition-opacity duration-(--duration-base) group-hover/reel:opacity-100 md:flex"
          >
            <span className="flex h-12 items-center gap-2 rounded-full bg-white px-5 text-small font-extrabold text-ink">
              <Volume2 className="size-[18px]" /> Click for sound
            </span>
          </span>
        )}
        <span className="relative flex h-[30px] items-center rounded-full bg-night/60 px-3 text-[12px] font-extrabold tracking-[0.06em] text-white uppercase">
          {muted ? "Tap for sound" : "Sound on"}
        </span>
        <span className="relative flex size-10 items-center justify-center rounded-full bg-night/60 text-white">
          {muted ? (
            <VolumeX aria-hidden="true" className="size-[18px]" />
          ) : (
            <Volume2 aria-hidden="true" className="size-[18px]" />
          )}
        </span>
      </button>
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
        itemClassName="w-[72%] sm:w-[44%] md:w-[calc((100%-36px)/4)]"
        showDots
        headerAside={
          <a
            href={site.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-[52px] shrink-0 items-center gap-3 rounded-full border-[1.5px] border-ink py-1.5 pr-2 pl-1.5 transition-colors duration-(--duration-base) hover:bg-ink hover:text-white md:mb-1"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-brand text-ink transition-transform duration-(--duration-base) ease-(--ease-out-soft) group-hover:-rotate-12">
              <InstagramIcon className="size-[19px]" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="label-caps text-[10px] text-brand-ink transition-colors group-hover:text-brand">
                Follow us
              </span>
              <span className="text-small font-bold">@{INSTAGRAM_HANDLE}</span>
            </span>
            <span className="ml-1 flex size-9 items-center justify-center rounded-full bg-ink text-white transition-colors duration-(--duration-base) group-hover:bg-brand group-hover:text-ink">
              <ArrowUpRight
                aria-hidden="true"
                className="size-[18px] transition-transform duration-(--duration-fast) group-hover:translate-x-px group-hover:-translate-y-px"
              />
            </span>
          </a>
        }
        renderItem={(reel) => (
          <Reel reel={reel} onBroken={() => setBroken((s) => new Set(s).add(reel._id))} />
        )}
      />
    </section>
  );
}
