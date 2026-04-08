// Timezone-aware date math for the dashboard.
// All "new this week" / "coming soon" windows are computed in APP_TZ so
// that a show airing at 9pm ET shows up on that calendar day, not the next.

export const APP_TZ = "America/New_York";

// Returns today's date in APP_TZ as a YYYY-MM-DD string.
export function todayInAppTz(now: Date = new Date()): string {
  // 'en-CA' gives us ISO-ish YYYY-MM-DD formatting.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Adds `days` days (may be negative) to a YYYY-MM-DD string and returns
// the new YYYY-MM-DD string. Pure calendar math — no timezone involved
// since we're manipulating a plain date.
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  // Use UTC so DST transitions don't shift the day.
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Human-friendly "3 days from now" / "2 days ago" / "today" / "tomorrow".
export function relativeDay(ymd: string, today: string = todayInAppTz()): string {
  if (ymd === today) return "today";
  const diff = daysBetween(today, ymd);
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff} days`;
  return `${-diff} days ago`;
}

export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const f = Date.UTC(fy, fm - 1, fd);
  const t = Date.UTC(ty, tm - 1, td);
  return Math.round((t - f) / (1000 * 60 * 60 * 24));
}

// Pretty-print a YYYY-MM-DD as e.g. "Apr 14".
export function formatShortDate(ymd: string | null | undefined): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(date);
}
