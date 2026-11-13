import type { IssueSummary } from "@/data/issues";
import { isPaymentCheckOutcome } from "@/lib/payment-check";
import { paymentStatusLabel } from "@/lib/payments/outcome-details";
import type { PaymentCheckOutcome, PaymentCheckRequest } from "@/lib/payments/types";
import { parsePaymentCheck } from "@/lib/payments/validation";

export type CaseVerification = {
  id: string;
  request: PaymentCheckRequest;
  outcome: PaymentCheckOutcome;
};

export type SavedIssue = {
  id: string;
  originCheckId: string;
  createdAt: string;
  closedAt?: string;
  history: [CaseVerification, ...CaseVerification[]];
};

export const savedCaseIdPattern = /^PR-[0-9A-F]{32}$/;
export const latestVerification = (issue: SavedIssue) => issue.history[issue.history.length - 1];

export function matchedReference(issue: SavedIssue) {
  return issue.history.find(({ outcome }) => "evidence" in outcome)?.request.upiReference;
}

export function summarizeCase(issue: SavedIssue): IssueSummary {
  return {
    id: issue.id,
    claimedAmountRupees: issue.history[0].request.amountRupees,
    status: issue.closedAt ? "resolved" : "open",
    claimSummary: paymentStatusLabel[latestVerification(issue).outcome.status],
  };
}

export function findSavedCase(cases: readonly SavedIssue[], check: CaseVerification) {
  return cases.find((issue) => {
    if (issue.originCheckId === check.id) return true;
    // A supplied reference identifies a repeat only when the amount and date agree.
    // Time and amount alone cannot identify an unreferenced customer claim.
    const { upiReference, paymentDate, amountRupees } = check.request;
    const original = issue.history[0].request;
    return upiReference !== undefined && upiReference === (matchedReference(issue) ?? original.upiReference)
      && original.paymentDate === paymentDate && original.amountRupees === amountRupees;
  });
}

export const canCloseCase = (issue: SavedIssue) => {
  const { status } = latestVerification(issue).outcome;
  return !issue.closedAt && (status === "received" || status === "failed");
};

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isVerification(value: unknown): value is CaseVerification {
  if (typeof value !== "object" || value === null) return false;
  const check = value as Partial<CaseVerification>;
  return typeof check.id === "string" && check.request !== undefined
    && parsePaymentCheck(check.request) !== undefined && isPaymentCheckOutcome(check.outcome, check.request);
}

export function decodeCases(raw: string): SavedIssue[] {
  const cases: unknown = JSON.parse(raw);
  if (!Array.isArray(cases)) throw new Error("Invalid saved cases.");
  const ids = new Set<string>();
  for (const value of cases) {
    if (typeof value !== "object" || value === null) throw new Error("Invalid saved case.");
    const issue = value as Partial<SavedIssue>;
    if (typeof issue.id !== "string" || !savedCaseIdPattern.test(issue.id) || ids.has(issue.id)
      || typeof issue.originCheckId !== "string" || !isTimestamp(issue.createdAt)
      || (issue.closedAt !== undefined && !isTimestamp(issue.closedAt))
      || !Array.isArray(issue.history) || issue.history.length === 0 || !issue.history.every(isVerification)) {
      throw new Error("Invalid saved case.");
    }
    ids.add(issue.id);
  }
  return cases;
}
