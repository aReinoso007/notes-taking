/** Calendar-day helpers — boundaries are local-time midnight. */

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfLocalDay(a).getTime() - startOfLocalDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Card timestamps: `today`, `yesterday`, else `July 16` (month + day, no year).
 */
export function formatCardDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diff = daysBetween(now, date);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";

  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/**
 * Note page timestamp: `Last Edited: July 21, 2024 at 8:39pm`
 */
export function formatLastEdited(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const datePart = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  return `Last Edited: ${datePart} at ${hours}:${minutes}${ampm}`;
}
