export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** ₹8,450 / ₹1,25,000 (Indian digit grouping). Takes rupees. */
export function formatINR(rupees: number) {
  return inr.format(rupees);
}

// Fixed zone so server and client render identical text (no hydration drift).
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

export const formatTime = (iso: string) => timeFmt.format(new Date(iso)).toUpperCase();
export const formatDateTime = (iso: string) =>
  dateTimeFmt.format(new Date(iso)).replace(/\b(am|pm)\b/, (m) => m.toUpperCase());
