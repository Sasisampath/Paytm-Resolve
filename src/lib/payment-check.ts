import type {
  PaymentCheckOutcome,
  PaymentCheckRequest,
  PaymentFormErrors,
  PaymentFormValues,
} from "@/components/check-payment/types";

import {
  DEMO_PAYMENT_DATE, isPaymentTime, isReference, MAX_AMOUNT_RUPEES, MAX_REFERENCE_LENGTH, toPaise,
} from "./payments/validation";

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
  else if (toPaise(n) === undefined) errors.amount = "Enter an amount with up to two decimal places.";
  if (!isPaymentTime(v.approximateTime)) errors.approximateTime = "Choose the approximate payment time.";
  return errors;
}

export function toPaymentCheckRequest(v: PaymentFormValues): PaymentCheckRequest {
  return {
    amountRupees: Number(v.amount),
    paymentDate: DEMO_PAYMENT_DATE,
    approximateTime: v.approximateTime,
    upiReference: v.upiReference.trim() || undefined,
  };
}

const evidenceStatus = { received: "SUCCESS", pending: "PENDING", failed: "FAILED" } as const;

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function isPaymentCheckOutcome(value: unknown, request: PaymentCheckRequest): value is PaymentCheckOutcome {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  if (result.isSimulated !== true || !isTimestamp(result.checkedAt)) return false;
  switch (result.status) {
    case "received":
    case "pending":
    case "failed": {
      if (typeof result.evidence !== "object" || result.evidence === null) return false;
      const evidence = result.evidence as Record<string, unknown>;
      return typeof evidence.id === "string" && typeof evidence.merchantId === "string"
        && isReference(evidence.upiReference) && evidence.upiReference === request.upiReference
        && evidence.amountPaise === toPaise(request.amountRupees)
        && isTimestamp(evidence.transactionTimestamp) && isTimestamp(evidence.statusObservedAt)
        && evidence.providerStatus === evidenceStatus[result.status]
        && evidence.source === (result.status === "received" ? "merchant_record" : "provider_record");
    }
    case "not_verified":
      return result.evidence === undefined && (result.reason === "no_match" || result.reason === "details_mismatch");
    case "more_details_needed":
      return result.evidence === undefined && (result.reason === "reference_required" || result.reason === "multiple_matches");
    case "unavailable":
      return result.evidence === undefined && (result.reason === "records_unavailable" || result.reason === "request_failed");
    default:
      return false;
  }
}

export async function submitPaymentCheck(request: PaymentCheckRequest): Promise<PaymentCheckOutcome> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok || response.status === 503) {
      const outcome: unknown = await response.json();
      if (isPaymentCheckOutcome(outcome, request) && (response.ok || outcome.status === "unavailable")) {
        return outcome;
      }
    }
  } catch {
    // Network, timeout and decoding failures leave payment status unknown.
  }

  return { status: "unavailable", reason: "request_failed", checkedAt, isSimulated: true };
}
