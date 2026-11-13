/**
 * Confirmed merchant receipts only (synthetic demo data).
 * Customer claims and issue cases live in `issues.ts` and must never be mixed
 * into this list: an unverified claim is not a received payment.
 */
export type ConfirmedPayment = {
  id: string;
  amountRupees: number;
  status: "confirmed";
  /** ISO timestamp, IST. */
  receivedAt: string;
};

export const confirmedPayments: ConfirmedPayment[] = [
  { id: "TX-2006", amountRupees: 500, status: "confirmed", receivedAt: "2026-11-13T09:48:00+05:30" },
  { id: "TX-2005", amountRupees: 1250, status: "confirmed", receivedAt: "2026-11-13T09:32:00+05:30" },
  { id: "TX-2004", amountRupees: 2100, status: "confirmed", receivedAt: "2026-11-13T09:10:00+05:30" },
  { id: "TX-2003", amountRupees: 1800, status: "confirmed", receivedAt: "2026-11-13T08:41:00+05:30" },
  { id: "TX-2002", amountRupees: 1500, status: "confirmed", receivedAt: "2026-11-13T08:15:00+05:30" },
  { id: "TX-2001", amountRupees: 1300, status: "confirmed", receivedAt: "2026-11-13T07:52:00+05:30" },
];

const byNewest = (a: ConfirmedPayment, b: ConfirmedPayment) =>
  b.receivedAt.localeCompare(a.receivedAt);

export function getRecentPayments(limit = 3) {
  return [...confirmedPayments].sort(byNewest).slice(0, limit);
}

/** Sum of confirmed receipts only. */
export function getReceivedTotal(payments: ConfirmedPayment[] = confirmedPayments) {
  return payments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amountRupees, 0);
}
