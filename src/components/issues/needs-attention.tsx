import type { IssueSummary } from "@/data/issues";
import { IssueList } from "./issue-list";

export function NeedsAttention({ issues }: { issues: IssueSummary[] }) {
  return (
    <section aria-labelledby="attention-title">
      <h2 id="attention-title" className="mb-3 text-base font-bold text-ink">
        Needs attention
      </h2>
      <IssueList issues={issues} />
    </section>
  );
}
