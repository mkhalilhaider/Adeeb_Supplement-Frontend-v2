/** Admin table classes and small formatters (kept out of ui.jsx for fast refresh). */
export const th =
  "border-b border-line bg-shelf px-3 py-2.5 text-left label-caps text-ink-3 whitespace-nowrap";
export const td = "border-b border-line px-3 py-3 align-top";

const DATE_TIME = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
export const shortDateTime = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : DATE_TIME.format(d);
};

/** "3 h ago", "2 d ago" — for activity columns. */
export function timeAgo(value, now = Date.now()) {
  const ms = now - new Date(value).getTime();
  if (!Number.isFinite(ms)) return "";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${Math.max(1, min)} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export const adminQuery = { meta: { private: true }, staleTime: 30_000 };
