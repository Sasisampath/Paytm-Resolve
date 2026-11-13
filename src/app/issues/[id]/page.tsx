import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CircleAlert, Clock3, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/issues/status-badge";
import { getIssue, issues, issueStatusMeta, type EvidenceState } from "@/data/issues";
import { formatDateTime, formatINR } from "@/lib/utils";

export function generateStaticParams() {
  return issues.map((i) => ({ id: i.id }));
}

const evidenceUi: Record<EvidenceState, { label: string; Icon: typeof Clock3; cls: string }> = {
  provided: { label: "Customer-provided", Icon: CircleAlert, cls: "text-warning" },
  not_checked: { label: "Not checked", Icon: Clock3, cls: "text-muted" },
  not_provided: { label: "Not provided", Icon: CircleAlert, cls: "text-muted" },
};

export default function IssueDetailPage({ params }: PageProps<"/issues/[id]">) {
  // URL data (params) is read behind Suspense so the app shell can render instantly.
  return (
    <Suspense fallback={<PageHeader title="Loading case…" backHref="/issues" backLabel="All issues" />}>
      <IssueDetail params={params} />
    </Suspense>
  );
}

async function IssueDetail({ params }: { params: PageProps<"/issues/[id]">["params"] }) {
  const { id } = await params;
  const issue = getIssue(id);
  if (!issue) notFound();

  return (
    <>
      <PageHeader title={issue.id} backHref="/issues" backLabel="All issues" />

      <section className="mb-4 rounded-2xl border border-line bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Claimed payment</p>
            <p className="text-2xl font-bold text-ink">{formatINR(issue.claimedAmountRupees)}</p>
          </div>
          <StatusBadge status={issue.status} />
        </div>
        <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-muted">Case reference</dt>
            <dd className="font-semibold text-ink">{issue.id}</dd>
          </div>
          <div>
            <dt className="text-muted">Reported</dt>
            <dd className="font-semibold text-ink">
              <time dateTime={issue.reportedAt}>{formatDateTime(issue.reportedAt)}</time>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="font-semibold text-ink">
              {issueStatusMeta[issue.status].label}
              <span className="block font-normal text-muted">{issueStatusMeta[issue.status].hint}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Customer claim</dt>
            <dd className="text-ink">{issue.claimSummary}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="evidence-title" className="mb-4">
        <h2 id="evidence-title" className="mb-3 text-base font-bold text-ink">
          Available evidence
        </h2>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {issue.evidence.map((e) => {
            const ui = evidenceUi[e.state];
            return (
              <li key={e.label} className="flex gap-3 p-4">
                <ui.Icon size={20} strokeWidth={2} className={`mt-0.5 shrink-0 ${ui.cls}`} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {e.label} <span className={`font-medium ${ui.cls}`}>· {ui.label}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{e.note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div role="note" className="flex gap-3 rounded-2xl border border-line bg-cyan-soft p-4 text-sm leading-relaxed text-navy">
        <Info size={20} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          This case is not confirmed as received. Payment verification will be connected in Phase 2.
          A claim or screenshot is not proof of payment, and no match is not proof of fraud.
        </p>
      </div>
    </>
  );
}
