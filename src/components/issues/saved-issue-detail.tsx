"use client";

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { appendVerification, closeIssue, useSavedCases } from "@/lib/issues/browser-store";
import { canCloseCase, latestVerification, matchedReference, summarizeCase, type SavedIssue } from "@/lib/issues/cases";
import { sanitizeReference, submitPaymentCheck } from "@/lib/payment-check";
import { evidenceSource, paymentStatusLabel, reportedPaymentTime } from "@/lib/payments/outcome-details";
import { formatDateTime, formatINR } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

const primary = "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 text-base font-bold text-white hover:bg-[#14266a] disabled:bg-line disabled:text-muted";
const timeLabel = (timestamp: string) => `${formatDateTime(timestamp)} IST`;

export function SavedIssueDetail({ id }: { id: string }) {
  const { cases, loading, storageError } = useSavedCases();
  const issue = cases.find((item) => item.id === id);

  if (issue) return <CaseDetail key={issue.id} issue={issue} />;

  return (
    <>
      <PageHeader title={loading ? "Loading case…" : "Saved case"} backHref="/issues" backLabel="All issues" />
      {!loading && (
        <p role="status" className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">
          {storageError ? "Saved cases could not be read from this browser." : "This case is unavailable in this browser."}
        </p>
      )}
    </>
  );
}

function CaseDetail({ issue }: { issue: SavedIssue }) {
  const original = issue.history[0];
  const latest = latestVerification(issue);
  const caseStatus = summarizeCase(issue).status;
  const inFlight = useRef(false);
  const [operation, setOperation] = useState<"check" | "close">();
  const [message, setMessage] = useState("");
  const [referenceEdit, setReferenceEdit] = useState<string>();
  const confirmedReference = matchedReference(issue);
  const reference = confirmedReference ?? referenceEdit ?? latest.request.upiReference ?? "";

  async function perform(action: "check" | "close") {
    if (inFlight.current || issue.closedAt) return;
    inFlight.current = true;
    setOperation(action);
    setMessage("");
    try {
      let updated: boolean;
      if (action === "check") {
        const request = { ...original.request, upiReference: reference || undefined };
        const outcome = await submitPaymentCheck(request);
        updated = await appendVerification(issue.id, latest.id, { id: crypto.randomUUID(), request, outcome });
        if (updated) setReferenceEdit(undefined);
      } else {
        updated = await closeIssue(issue.id, latest.id);
      }
      setMessage(updated
        ? action === "check" ? "Verification history updated." : "Case closed."
        : "This case changed in another tab. Review the latest result.");
    } catch {
      setMessage("Couldn’t update the case. Check that browser storage is available and try again.");
    } finally {
      inFlight.current = false;
      setOperation(undefined);
    }
  }

  return (
    <>
      <PageHeader title="Payment issue" backHref="/issues" backLabel="All issues" description="Demo case saved in this browser only." />

      <section aria-label="Case details" className="mb-4 rounded-2xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Claimed payment</p>
            <p className="text-2xl font-bold text-ink">{formatINR(original.request.amountRupees)}</p>
          </div>
          <StatusBadge status={caseStatus} />
        </div>
        <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-muted">Case reference</dt>
            <dd className="break-all font-semibold">{issue.id}</dd>
          </div>
          <div>
            <dt className="text-muted">Reported payment time</dt>
            <dd className="font-semibold">{timeLabel(reportedPaymentTime(original.request))}</dd>
          </div>
          <div>
            <dt className="text-muted">Original UPI reference</dt>
            <dd className="break-all font-semibold">{original.request.upiReference ?? "None provided"}</dd>
          </div>
          {issue.closedAt && (
            <div>
              <dt className="text-muted">Case closed</dt>
              <dd className="font-semibold">{timeLabel(issue.closedAt)}</dd>
            </div>
          )}
        </dl>
      </section>

      <section aria-labelledby="case-payment-status" className="mb-4 rounded-2xl border border-line bg-white p-4">
        <h2 id="case-payment-status" className="text-sm font-semibold text-muted">Latest payment status</h2>
        <p className="mt-1 text-lg font-bold text-ink">{paymentStatusLabel[latest.outcome.status]}</p>
        <p className="mt-1 text-sm text-muted">{evidenceSource(latest.outcome)}</p>
        <p className="mt-1 text-sm text-muted">Last checked {timeLabel(latest.outcome.checkedAt)}</p>
      </section>

      {!issue.closedAt && (
        <section aria-labelledby="case-actions" className="mb-4 space-y-3 rounded-2xl border border-line bg-white p-4">
          <h2 id="case-actions" className="font-bold text-ink">Recheck payment</h2>
          <form onSubmit={(event) => { event.preventDefault(); void perform("check"); }} className="space-y-3">
            <div>
              <label htmlFor="case-reference" className="mb-1 block text-sm font-semibold text-ink">UPI reference number <span className="font-normal text-muted">· Optional</span></label>
              <input
                id="case-reference"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter reference number"
                value={reference}
                disabled={operation !== undefined}
                readOnly={confirmedReference !== undefined}
                onChange={(event) => setReferenceEdit(sanitizeReference(event.target.value))}
                className="min-h-12 w-full scroll-mb-32 rounded-xl border border-line bg-white px-4 text-base text-ink"
              />
            </div>
            <button type="submit" className={primary} disabled={operation !== undefined}>
              <RotateCcw size={18} aria-hidden="true" />
              {operation === "check" ? "Checking payment…" : "Recheck Payment"}
            </button>
          </form>
          {canCloseCase(issue) ? (
            <button
              type="button"
              onClick={() => void perform("close")}
              disabled={operation !== undefined || reference !== (latest.request.upiReference ?? "")}
              className="min-h-12 w-full rounded-xl border border-line px-4 text-sm font-semibold text-navy hover:bg-cyan-soft disabled:text-muted"
            >
              {operation === "close" ? "Closing case…" : "Close Case"}
            </button>
          ) : (
            <p className="text-sm text-muted">A confirmed receipt or provider-reported failure is required to close this case.</p>
          )}
        </section>
      )}
      <p role="status" className={message ? "mb-4 text-sm text-navy" : "sr-only"}>{message}</p>

      <section aria-labelledby="case-history" className="rounded-2xl border border-line bg-white p-4">
        <h2 id="case-history" className="font-bold text-ink">Verification history</h2>
        <ol className="mt-2 divide-y divide-line">
          {[...issue.history].reverse().map(({ id, request, outcome }) => (
            <li key={id} className="space-y-1 py-3 text-sm">
              <p className="font-semibold text-ink">{paymentStatusLabel[outcome.status]}</p>
              <time dateTime={outcome.checkedAt} className="block text-muted">{timeLabel(outcome.checkedAt)}</time>
              <p className="text-muted">{evidenceSource(outcome)}</p>
              <p className="break-all text-muted">UPI reference {request.upiReference ?? "not provided"}</p>
              {"evidence" in outcome && (
                <p className="text-muted">Status observed {timeLabel(outcome.evidence.statusObservedAt)}</p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
