import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PaymentIssue } from "@/data/issues";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export function IssueRow({ issue }: { issue: PaymentIssue }) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="flex min-h-20 items-center gap-3 rounded-2xl border border-line border-l-4 border-l-warning bg-white p-4 transition-colors hover:bg-cyan-soft"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted">{issue.id}</span>
          <StatusBadge status={issue.status} />
        </div>
        <p className="mt-1 text-lg font-bold text-ink">
          {formatINR(issue.claimedAmountRupees)}{" "}
          <span className="text-xs font-medium text-muted">claimed</span>
        </p>
        <p className="mt-0.5 text-sm leading-snug text-muted">{issue.claimSummary}</p>
      </div>
      <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}
