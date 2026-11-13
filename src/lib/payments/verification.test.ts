import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "@/app/api/payments/verify/route";
import { issues } from "@/data/issues";
import { merchant } from "@/data/merchant";
import { confirmedVerificationRecords, getReceivedTotal } from "@/data/transactions";
import { submitPaymentCheck } from "@/lib/payment-check";
import { mockPaymentProvider } from "./mock-provider";
import type { PaymentProvider, VerificationRequest } from "./types";
import { DEMO_PAYMENT_DATE, parsePaymentCheck, toPaise } from "./validation";
import { verifyPayment } from "./verification-engine";

const checkedAt = "2026-11-20T00:00:00.000Z";
const receipt = confirmedVerificationRecords[0];
const exact: VerificationRequest = {
  merchantId: merchant.id,
  amountPaise: 50_000,
  paymentDate: DEMO_PAYMENT_DATE,
  approximateTime: "09:48",
  upiReference: "990000002006",
};
const apiInput = {
  amountRupees: 500,
  paymentDate: exact.paymentDate,
  approximateTime: exact.approximateTime,
  upiReference: exact.upiReference,
};
const check = (overrides: Partial<VerificationRequest> = {}, provider = mockPaymentProvider) =>
  verifyPayment({ ...exact, ...overrides }, provider, checkedAt);
const post = (body: object | string) =>
  POST(new Request("http://localhost/api/payments/verify", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));

test("confirms the exact reference, amount and merchant using an existing receipt", async () => {
  const result = await check();
  assert.equal(result.status, "received");
  assert.equal(result.checkedAt, checkedAt);
  assert.equal(result.isSimulated, true);
  assert.deepEqual(result.evidence, receipt);
  assert.equal(getReceivedTotal(), 8_450);
});

test("rejects an incorrect reference without falling back to time and amount", async () => {
  const result = await check({ upiReference: "990000002099" });
  assert.equal(result.status, "not_verified");
  assert.equal(result.reason, "no_match");
});

test("rejects a correct reference with an incorrect amount", async () => {
  const result = await check({ amountPaise: exact.amountPaise + 1 });
  assert.equal(result.status, "not_verified");
  assert.equal(result.reason, "details_mismatch");
});

test("rejects a correct reference and amount on a different payment date", async () => {
  assert.equal((await check({ paymentDate: "2026-11-14" })).status, "not_verified");
});

test("a different merchant cannot verify or receive the evidence", async () => {
  const result = await check({ merchantId: "another-merchant" });
  assert.equal(result.status, "not_verified");
  assert.equal("evidence" in result, false);
  assert.equal((await post({ ...apiInput, merchantId: "another-merchant" })).status, 400);
});

test("amount and approximate time alone request a reference even for one candidate", async () => {
  const result = await check({ upiReference: undefined });
  assert.equal(result.status, "more_details_needed");
  assert.equal(result.reason, "reference_required");
});

test("no reference outside the approximate search window yields no match", async () => {
  const result = await check({ upiReference: undefined, approximateTime: "12:00" });
  assert.equal(result.status, "not_verified");
});

test("multiple matching payments need more details", async () => {
  const result = await check({ amountPaise: 65_000, approximateTime: "09:40", upiReference: undefined });
  assert.equal(result.status, "more_details_needed");
  assert.equal(result.reason, "multiple_matches");
});

test("reports pending only from an explicitly pending provider record", async () => {
  const result = await check({ amountPaise: 85_000, approximateTime: "09:21", upiReference: "990000000850" });
  assert.equal(result.status, "pending");
  assert.equal(result.evidence.providerStatus, "PENDING");
  assert.equal(result.evidence.source, "provider_record");
  assert.equal(result.evidence.statusObservedAt, "2026-11-13T09:24:00+05:30");
  assert.equal(result.checkedAt, checkedAt);
});

test("reports failed only from an explicitly failed provider record", async () => {
  const result = await check({ amountPaise: 65_000, approximateTime: "09:38", upiReference: "990000000650" });
  assert.equal(result.status, "failed");
  assert.equal(result.evidence.providerStatus, "FAILED");
});

test("an unavailable provider yields an unavailable outcome and HTTP 503", async () => {
  const response = await post({ ...apiInput, upiReference: "990000000503" });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "unavailable");
});

test("an invalid provider record cannot confirm a payment", async () => {
  const provider: PaymentProvider = {
    async readRecords() {
      return [{ ...receipt, statusObservedAt: "invalid" }];
    },
  };
  assert.equal((await check({}, provider)).status, "unavailable");
});

test("a screenshot or client-supplied success status cannot verify the ₹2,000 claim", async () => {
  const response = await post({
    ...apiInput,
    amountRupees: 2000,
    approximateTime: "09:55",
    upiReference: undefined,
    customerScreenshot: true,
    providerStatus: "SUCCESS",
  });
  assert.equal(response.status, 200);
  const outcome = await response.json();
  assert.equal(outcome.status, "not_verified");
  assert.equal("evidence" in outcome, false);
  assert.equal(issues.find(({ id }) => id === "PR-1001")?.status, "not_verified");
});

test("a customer debit does not establish a pending provider status", async () => {
  const response = await post({
    ...apiInput,
    amountRupees: 850,
    approximateTime: "09:21",
    upiReference: undefined,
    customerDebit: true,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "more_details_needed");
  assert.equal(issues.find(({ id }) => id === "PR-1002")?.status, "awaiting_status_check");
});

test("duplicate copies do not count as multiple payments", async () => {
  const provider: PaymentProvider = { async readRecords() { return [receipt, { ...receipt }]; } };
  assert.equal((await check({}, provider)).status, "received");
  const noReference = await check({ upiReference: undefined }, provider);
  assert.equal(noReference.status, "more_details_needed");
  assert.equal(noReference.reason, "reference_required");
});

test("two distinct records with the same reference cannot establish receipt", async () => {
  const provider: PaymentProvider = {
    async readRecords() { return [receipt, { ...receipt, id: "another-record" }]; },
  };
  const result = await check({}, provider);
  assert.equal(result.status, "more_details_needed");
  assert.equal(result.reason, "multiple_matches");
});

test("converts valid decimal amounts exactly to integer paise", async () => {
  assert.equal(toPaise(850.29), 85_029);
  assert.equal(toPaise(0.01), 1);
  assert.equal(toPaise(1_000_000), 100_000_000);
  const response = await post({ ...apiInput, amountRupees: 500.01 });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "not_verified");
});

test("invalid amount, date, time and reference are rejected at the API boundary", async () => {
  for (const amountRupees of [0, -1, 12.345, 1_000_000.01, "500", null]) {
    assert.equal((await post({ ...apiInput, amountRupees })).status, 400);
  }
  assert.equal(toPaise(Infinity), undefined);
  assert.equal(toPaise(NaN), undefined);
  for (const invalid of [
    { approximateTime: "24:00" },
    { approximateTime: "9:48" },
    { paymentDate: "2026-02-30" },
    { paymentDate: undefined },
    { upiReference: "abc123" },
    { upiReference: 990000002006 },
    { upiReference: "0".repeat(25) },
  ]) {
    assert.equal((await post({ ...apiInput, ...invalid })).status, 400);
  }
  assert.equal((await post("{")).status, 400);
  assert.equal(parsePaymentCheck(null), undefined);
});

test("the client reports network errors, timeouts and malformed successes as unavailable", async (t) => {
  const request = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Network failure");
  });
  assert.equal((await submitPaymentCheck(apiInput)).status, "unavailable");
  request.mock.mockImplementation(async () => {
    throw new DOMException("Timed out", "TimeoutError");
  });
  assert.equal((await submitPaymentCheck(apiInput)).status, "unavailable");
  request.mock.mockImplementation(async () =>
    Response.json({ status: "received", checkedAt, isSimulated: true }));
  assert.equal((await submitPaymentCheck(apiInput)).status, "unavailable");
  request.mock.mockImplementation(async () => new Response("Server error", { status: 500 }));
  assert.equal((await submitPaymentCheck(apiInput)).status, "unavailable");
});
