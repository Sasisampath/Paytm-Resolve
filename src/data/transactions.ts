import { merchant } from "./merchant";
import type { TrustedPaymentRecord } from "@/lib/payments/types";
import { toPaise } from "@/lib/payments/validation";

/**
 * Confirmed merchant receipts only (synthetic demo data).
 * Customer claims and issue cases live in `issues.ts` and must never be mixed
 * into this list: an unverified claim is not a received payment.
 */
export type ConfirmedPayment = {
  id: string;
  demoReference: string;
  amountRupees: number;
  status: "confirmed";
  /** ISO timestamp, IST. */
  receivedAt: string;
};

export const confirmedPayments: ConfirmedPayment[] = [
  { id: "TX-2006", demoReference: "990000002006", amountRupees: 500, status: "confirmed", receivedAt: "2026-11-13T09:48:00+05:30" },
  { id: "TX-2005", demoReference: "990000002005", amountRupees: 1250, status: "confirmed", receivedAt: "2026-11-13T09:32:00+05:30" },
  { id: "TX-2004", demoReference: "990000002004", amountRupees: 2100, status: "confirmed", receivedAt: "2026-11-13T09:10:00+05:30" },
  { id: "TX-2003", demoReference: "990000002003", amountRupees: 1800, status: "confirmed", receivedAt: "2026-11-13T08:41:00+05:30" },
  { id: "TX-2002", demoReference: "990000002002", amountRupees: 1500, status: "confirmed", receivedAt: "2026-11-13T08:15:00+05:30" },
  { id: "TX-2001", demoReference: "990000002001", amountRupees: 1300, status: "confirmed", receivedAt: "2026-11-13T07:52:00+05:30" },
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

/** Keep verification tied to the same confirmed receipts shown on Merchant Home. */
export const confirmedVerificationRecords: readonly TrustedPaymentRecord[] = confirmedPayments.map((payment) => {
  const amountPaise = toPaise(payment.amountRupees);
  if (amountPaise === undefined) throw new Error("Invalid synthetic merchant receipt.");
  return {
    id: payment.id,
    merchantId: merchant.id,
    amountPaise,
    transactionTimestamp: payment.receivedAt,
    upiReference: payment.demoReference,
    statusObservedAt: payment.receivedAt,
    providerStatus: "SUCCESS",
    source: "merchant_record",
  };
});
