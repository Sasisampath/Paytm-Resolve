import Image from "next/image";
import type { IssueSummary } from "@/data/issues";
import { IssueRow } from "./issue-row";

/** Shows either the populated list or the empty state, never both. */
export function IssueList({ issues }: { issues: IssueSummary[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-8 text-center">
        <Image
          src="/assets/no-payment-issues.png"
          alt="Clipboard with a green check mark"
          width={900}
          height={675}
          className="h-auto w-48"
        />
        <h3 className="mt-2 text-lg font-bold text-ink">All clear!</h3>
        <p className="mt-1 text-sm text-muted">No payment issues need your attention.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {issues.map((issue) => (
        <li key={issue.id}>
          <IssueRow issue={issue} />
        </li>
      ))}
    </ul>
  );
}
