import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { getOpenIssues, issues } from "@/data/issues";
import { getReceivedTotal } from "@/data/transactions";
import { merchant } from "@/data/merchant";
import { mockPaymentProvider } from "@/lib/payments/mock-provider";
import { DEMO_PAYMENT_DATE } from "@/lib/payments/validation";
import { verifyPayment } from "@/lib/payments/verification-engine";
import { appendVerification, closeIssue, saveIssue } from "./browser-store";
import { canCloseCase, decodeCases, latestVerification, summarizeCase, type CaseVerification } from "./cases";

function mockBrowser(t: TestContext, target: EventTarget) {
  Object.defineProperty(globalThis, "window", { configurable: true, value: target });
  t.after(() => { Reflect.deleteProperty(globalThis, "window"); });
}

const checkedAt = "2026-11-13T10:00:00+05:30";

async function verification(id: string, upiReference?: string, checked = checkedAt): Promise<CaseVerification> {
  const request = { amountRupees: 500, paymentDate: DEMO_PAYMENT_DATE, approximateTime: "09:48", upiReference };
  const outcome = await verifyPayment({ ...request, merchantId: merchant.id, amountPaise: 50_000 }, mockPaymentProvider, checked);
  return { id, request, outcome };
}

test("case writes persist, deduplicate repeated submissions and guard against stale updates", async (t) => {
  const storage = new Map<string, string>();
  const target = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
  mockBrowser(t, target);
  const readCases = () => decodeCases([...storage.values()][0]);

  const original = await verification("original");
  assert.equal(original.outcome.status, "more_details_needed");
  const [saved, repeated] = await Promise.all([saveIssue(original), saveIssue(original)]);
  assert.equal(repeated.id, saved.id);
  assert.equal(readCases().length, 1);
  assert.deepEqual(readCases()[0].history[0], JSON.parse(JSON.stringify(original)));
  await assert.rejects(closeIssue(saved.id, original.id), /final verified outcome/);

  const confirmed = await verification("confirmed", "990000002006", "2026-11-13T10:10:00+05:30");
  assert.equal(await appendVerification(saved.id, original.id, confirmed), true);
  assert.equal(await appendVerification(saved.id, original.id, original), false);
  assert.equal(await closeIssue(saved.id, original.id), false);
  assert.equal(latestVerification(readCases()[0]).outcome.status, "received");
  assert.equal(canCloseCase(readCases()[0]), true);
  const unrelated = await verification("different", "990000002099");
  await assert.rejects(appendVerification(saved.id, confirmed.id, unrelated), /this case’s payment details/);
  assert.equal(getOpenIssues([...readCases().map(summarizeCase), ...issues]).length, 3);

  assert.equal(await closeIssue(saved.id, confirmed.id), true);
  assert.equal(await appendVerification(saved.id, confirmed.id, original), false);
  assert.equal(readCases()[0].history.length, 2);
  assert.equal(summarizeCase(readCases()[0]).status, "resolved");
  assert.equal(getOpenIssues([...readCases().map(summarizeCase), ...issues]).length, 2);
  assert.equal(getReceivedTotal(), 8_450);
});

test("a verified provider failure permits closure without receipt and remains deduplicated", async (t) => {
  const storage = new Map<string, string>();
  mockBrowser(t, Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  }));
  const request = { amountRupees: 650, paymentDate: DEMO_PAYMENT_DATE, approximateTime: "09:38", upiReference: "990000000650" };
  const outcome = await verifyPayment({ ...request, merchantId: merchant.id, amountPaise: 65_000 }, mockPaymentProvider, checkedAt);
  const issue = await saveIssue({ id: "failed", request, outcome });
  assert.equal(outcome.status, "failed");
  assert.equal(canCloseCase(issue), true);
  assert.equal(await closeIssue(issue.id, "failed"), true);
  assert.equal((await saveIssue({ id: "another-check", request, outcome })).id, issue.id);
  const cases = decodeCases([...storage.values()][0]);
  assert.equal(cases.length, 1);
  assert.equal(latestVerification(cases[0]).outcome.status, "failed");
  assert.equal(summarizeCase(cases[0]).status, "resolved");
  await assert.rejects(saveIssue(await verification("received", "990000002006")), /already confirmed/);
});

test("storage rejects malformed evidence and leaves unreadable data intact", async (t) => {
  const original = await verification("original");
  assert.throws(() => decodeCases('{"invalid":true}'));
  assert.throws(() => decodeCases(JSON.stringify([{
    id: "PR-" + "A".repeat(32),
    originCheckId: original.id,
    createdAt: checkedAt,
    history: [{ ...original, outcome: { ...original.outcome, evidence: {} } }],
  }])));
  const write = t.mock.fn();
  mockBrowser(t, Object.assign(new EventTarget(), {
    localStorage: { getItem: () => "{invalid", setItem: write },
  }));
  await assert.rejects(saveIssue(original));
  assert.equal(write.mock.callCount(), 0);
});
