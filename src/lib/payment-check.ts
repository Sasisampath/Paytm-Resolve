import type {
  PaymentCheckOutcome,
  PaymentCheckRequest,
  PaymentFormErrors,
  PaymentFormValues,
} from "@/components/check-payment/types";

export const MAX_AMOUNT_RUPEES = 10_00_000;
export const MAX_REFERENCE_LENGTH = 24;

/** Keep only digits and one decimal point, max 2 decimals, no leading zero runs. */
export function sanitizeAmount(input: string): string {
  let v = input.replace(/[^\d.]/g, "");
  const dot = v.indexOf(".");
  if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "");
  const [intPart, decPart] = v.split(".");
  const intClean = (intPart ?? "").replace(/^0+(?=\d)/, "").slice(0, 7);
  return decPart === undefined ? intClean : `${intClean || "0"}.${decPart.slice(0, 2)}`;
}

/** 1250000.5 -> "12,50,000.5" (Indian grouping) for display when not editing. */
export function groupAmount(raw: string): string {
  if (!raw) return "";
  const [i, d] = raw.split(".");
  const grouped = new Intl.NumberFormat("en-IN").format(Number(i || 0));
  return d === undefined ? grouped : `${grouped}.${d}`;
}

export const sanitizeReference = (input: string) =>
  input.replace(/\D/g, "").slice(0, MAX_REFERENCE_LENGTH);

export function validatePaymentForm(v: PaymentFormValues): PaymentFormErrors {
  const errors: PaymentFormErrors = {};
  const n = Number(v.amount);
  if (!v.amount || v.amount === ".") errors.amount = "Enter the payment amount.";
  else if (!Number.isFinite(n) || n <= 0) errors.amount = "Amount must be more than ₹0.";
  else if (n > MAX_AMOUNT_RUPEES) errors.amount = "That amount looks too large. Please check it.";
  if (!v.approximateTime) errors.approximateTime = "Choose the approximate payment time.";
  return errors;
}

export function toPaymentCheckRequest(v: PaymentFormValues): PaymentCheckRequest {
  return {
    amountRupees: Number(v.amount),
    approximateTime: v.approximateTime,
    upiReference: v.upiReference.trim() || undefined,
  };
}

/**
 * Submission seam for Phase 2. Replace the body with a call to a server-side
 * verification endpoint. For now NOTHING is checked and no result is invented.
 */
export async function submitPaymentCheck(
  request: PaymentCheckRequest,
): Promise<PaymentCheckOutcome> {
  void request;
  return { status: "not_connected" };
}
