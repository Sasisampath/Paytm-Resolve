import type { PaymentCheckRequest } from "./types";

export const DEMO_PAYMENT_DATE = "2026-11-13";
export const MAX_AMOUNT_RUPEES = 10_00_000;
export const MAX_REFERENCE_LENGTH = 24;

export function toPaise(amount: unknown): number | undefined {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT_RUPEES) {
    return undefined;
  }

  const decimal = String(amount);
  if (!/^\d+(?:\.\d{1,2})?$/.test(decimal)) return undefined;
  const [rupees, fraction = ""] = decimal.split(".");
  return Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
}

export const isPaymentTime = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

export const isReference = (value: unknown): value is string =>
  typeof value === "string" && value.length <= MAX_REFERENCE_LENGTH && /^\d+$/.test(value);

export function isPaymentDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parsePaymentCheck(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;

  const { amountRupees, paymentDate, approximateTime, upiReference } = value as Partial<PaymentCheckRequest>;
  const amountPaise = toPaise(amountRupees);
  if (amountPaise === undefined || !isPaymentDate(paymentDate) || !isPaymentTime(approximateTime)) return undefined;
  if (upiReference !== undefined && !isReference(upiReference)) return undefined;

  return { amountPaise, paymentDate, approximateTime, upiReference };
}
