"use client";

import { getOpenIssues, issues } from "@/data/issues";
import { useSavedCases } from "@/lib/issues/browser-store";
import { summarizeCase } from "@/lib/issues/cases";
import { OverviewCards } from "@/components/merchant/overview-cards";
import { RecentPayments } from "@/components/payments/recent-payments";
import type { ConfirmedPayment } from "@/data/transactions";
import { IssueList } from "./issue-list";
import { NeedsAttention } from "./needs-attention";

function useIssueList() {
  const { cases, storageError } = useSavedCases();
  return { allIssues: [...cases.map(summarizeCase), ...issues], storageError };
}

export function BrowserIssueList() {
  const { allIssues, storageError } = useIssueList();
  return (
    <>
      {storageError && <p role="alert" className="mb-3 text-sm text-danger">Saved cases could not be read from this browser.</p>}
      <IssueList issues={allIssues} />
    </>
  );
}

export function MerchantActivity({ receivedRupees, recentPayments }: {
  receivedRupees: number;
  recentPayments: ConfirmedPayment[];
}) {
  const { allIssues, storageError } = useIssueList();
  const openIssues = getOpenIssues(allIssues);
  return (
    <>
      <OverviewCards receivedRupees={receivedRupees} openIssues={openIssues.length} />
      <RecentPayments payments={recentPayments} />
      {storageError && <p role="alert" className="mb-3 text-sm text-danger">Saved cases could not be read from this browser.</p>}
      <NeedsAttention issues={openIssues} />
    </>
  );
}
