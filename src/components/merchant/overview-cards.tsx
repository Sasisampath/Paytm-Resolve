import { formatINR } from "@/lib/utils";

export function OverviewCards({
  receivedRupees,
  openIssues,
}: {
  receivedRupees: number;
  openIssues: number;
}) {
  return (
    <section aria-labelledby="overview-title" className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="overview-title" className="text-base font-bold text-ink">
          Today&apos;s overview
        </h2>
        <span className="rounded-full bg-cyan-soft px-2.5 py-1 text-xs font-semibold text-navy">
          Demo data
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm text-muted">Received today</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatINR(receivedRupees)}</p>
          <p className="mt-1 text-xs text-muted">Confirmed payments only</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm text-muted">Open issues</p>
          <p className="mt-1 text-2xl font-bold text-ink">{openIssues}</p>
          <p className="mt-1 text-xs text-muted">Not counted as received</p>
        </div>
      </div>
    </section>
  );
}
