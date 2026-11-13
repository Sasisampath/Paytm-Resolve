import type { PaymentCheckOutcome, PaymentProvider, TrustedPaymentRecord, VerificationRequest } from "./types";
import { isReference, MAX_AMOUNT_RUPEES } from "./validation";

const timeWindowMs = 15 * 60 * 1000;
const merchantDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", dateStyle: "short" });

function isTrustedRecord(record: TrustedPaymentRecord) {
  if (!record || !record.id || !record.merchantId || !isReference(record.upiReference)) return false;
  if (!Number.isInteger(record.amountPaise) || record.amountPaise < 1 || record.amountPaise > MAX_AMOUNT_RUPEES * 100) {
    return false;
  }
  const transactionTime = Date.parse(record.transactionTimestamp);
  const observedTime = Date.parse(record.statusObservedAt);
  if (!Number.isFinite(transactionTime) || !Number.isFinite(observedTime) || observedTime < transactionTime) {
    return false;
  }
  return record.source === "merchant_record"
    ? record.providerStatus === "SUCCESS"
    : record.source === "provider_record" && ["PENDING", "FAILED"].includes(record.providerStatus);
}

function uniqueRecords(records: readonly TrustedPaymentRecord[]) {
  const unique = new Map<string, TrustedPaymentRecord>();
  for (const record of records) {
    const key = JSON.stringify([
      record.id, record.merchantId, record.amountPaise, record.upiReference,
      Date.parse(record.transactionTimestamp), record.providerStatus, record.source, Date.parse(record.statusObservedAt),
    ]);
    unique.set(key, record);
  }
  return [...unique.values()];
}

export async function verifyPayment(
  request: VerificationRequest,
  provider: PaymentProvider,
  checkedAt: string,
): Promise<PaymentCheckOutcome> {
  const check = { checkedAt, isSimulated: true } as const;
  const unavailable = { ...check, status: "unavailable", reason: "records_unavailable" } as const;
  let records: readonly TrustedPaymentRecord[];
  try {
    records = await provider.readRecords(request);
    if (!Array.isArray(records) || !records.every(isTrustedRecord)) return unavailable;
  } catch {
    return unavailable;
  }

  const merchantRecords = uniqueRecords(records.filter((record) => record.merchantId === request.merchantId));
  const searchTime = Date.parse(`${request.paymentDate}T${request.approximateTime}:00+05:30`);
  const matchesDate = (record: TrustedPaymentRecord) =>
    merchantDate.format(new Date(record.transactionTimestamp)) === request.paymentDate;
  const candidates = request.upiReference
    ? merchantRecords.filter((record) => record.upiReference === request.upiReference)
    : merchantRecords.filter((record) => matchesDate(record) && record.amountPaise === request.amountPaise
      && Math.abs(Date.parse(record.transactionTimestamp) - searchTime) <= timeWindowMs);

  if (candidates.length > 1) return { ...check, status: "more_details_needed", reason: "multiple_matches" };
  const record = candidates[0];
  if (!record) return { ...check, status: "not_verified", reason: "no_match" };
  if (!request.upiReference) return { ...check, status: "more_details_needed", reason: "reference_required" };
  if (record.amountPaise !== request.amountPaise || !matchesDate(record)) {
    return { ...check, status: "not_verified", reason: "details_mismatch" };
  }

  switch (record.providerStatus) {
    case "SUCCESS":
      return { ...check, status: "received", evidence: record };
    case "PENDING":
      return { ...check, status: "pending", evidence: record };
    case "FAILED":
      return { ...check, status: "failed", evidence: record };
  }
}
