/**
 * Payment issue cases (synthetic demo data). These are customer *claims*.
 * A claim, screenshot or bank debit is NOT proof the merchant was paid, and a
 * missing match is NOT proof of fraud. Case evidence is a snapshot of the original report.
 */
export type IssueStatus = "open" | "not_verified" | "awaiting_status_check" | "resolved";

export type EvidenceState = "provided" | "not_provided" | "not_checked";

export type EvidenceItem = {
  label: string;
  state: EvidenceState;
  note: string;
};

export type PaymentIssue = {
  id: string;
  claimedAmountRupees: number;
  /** ISO timestamp, IST. When the customer says they paid / reported. */
  reportedAt: string;
  status: IssueStatus;
  claimSummary: string;
  evidence: EvidenceItem[];
};

export type IssueSummary = Omit<PaymentIssue, "reportedAt" | "evidence">;

export const issueStatusMeta: Record<IssueStatus, { label: string; hint: string }> = {
  open: { label: "Open", hint: "This case is open." },
  not_verified: {
    label: "Not verified",
    hint: "No matching confirmed payment has been checked yet.",
  },
  awaiting_status_check: {
    label: "Awaiting status check",
    hint: "The provider status has not been checked yet.",
  },
  resolved: { label: "Resolved", hint: "This case is closed." },
};

export const issues: PaymentIssue[] = [
  {
    id: "PR-1001",
    claimedAmountRupees: 2000,
    reportedAt: "2026-11-13T09:55:00+05:30",
    status: "not_verified",
    claimSummary: "Customer claims the payment succeeded.",
    evidence: [
      {
        label: "Customer payment screen",
        state: "provided",
        note: "Shown by the customer. This is a claim, not proof you received the money.",
      },
      {
        label: "Matching merchant record",
        state: "not_checked",
        note: "No verification result was recorded for this case.",
      },
      { label: "UPI reference number", state: "not_provided", note: "None given." },
    ],
  },
  {
    id: "PR-1002",
    claimedAmountRupees: 850,
    reportedAt: "2026-11-13T09:21:00+05:30",
    status: "awaiting_status_check",
    claimSummary:
      "Customer reports a bank debit. The provider status has not yet been verified.",
    evidence: [
      {
        label: "Customer bank debit",
        state: "provided",
        note: "Reported by the customer. A debit alone does not confirm you were paid.",
      },
      {
        label: "Provider status",
        state: "not_checked",
        note: "No verification result was recorded for this case.",
      },
      { label: "UPI reference number", state: "not_provided", note: "None given." },
    ],
  },
];

export const getOpenIssues = (list: readonly IssueSummary[] = issues) =>
  list.filter((i) => i.status !== "resolved");

export const getIssue = (id: string) => issues.find((i) => i.id === id);
