"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, Info, RotateCcw } from "lucide-react";
import { saveIssue } from "@/lib/issues/browser-store";
import { evidenceSource, paymentStatusLabel, reportedPaymentTime } from "@/lib/payments/outcome-details";
import { submitPaymentCheck } from "@/lib/payment-check";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import { savePaymentCheck, useSavedPaymentCheck } from "./payment-check-session";
import { TamilGuidance } from "./tamil-guidance";
import type { PaymentCheckOutcome } from "./types";

const presentation = {
  received: {
    description: "This payment is confirmed in the simulated merchant records.",
    image: "payment-received",
    tone: "text-green-800",
    steps: [],
  },
  not_verified: {
    description: "We couldn’t confirm this payment in the available merchant records.",
    image: "payment-not-verified",
    tone: "text-red-800",
    steps: [
      "Ask for the UPI reference number and check the payment details.",
      "Check your official merchant records. A customer screenshot alone is insufficient.",
    ],
  },
  pending: {
    description: "The simulated provider recorded this payment as still processing.",
    image: "payment-pending",
    tone: "text-amber-800",
    steps: [
      "Check the official provider status for a final update.",
      "Wait for the final status before asking for another payment for this order.",
    ],
  },
  failed: {
    description: "The simulated provider recorded this payment attempt as failed.",
    image: "payment-not-verified",
    tone: "text-red-800",
    steps: ["Confirm the latest status in your official merchant records before asking the customer to retry."],
  },
  unavailable: {
    description: "We couldn’t check the payment records right now.",
    image: "verification-unavailable",
    tone: "text-muted",
    steps: ["Try the check again or check your official merchant records."],
  },
  more_details_needed: {
    description: "An exact UPI reference helps confirm which payment belongs to this check.",
    image: "payment-not-verified",
    tone: "text-amber-800",
    steps: ["Go back and enter or double-check the UPI reference and amount."],
  },
} satisfies Record<PaymentCheckOutcome["status"], {
  description: string;
  image: string;
  tone: string;
  steps: string[];
}>;

const providerLabels = { SUCCESS: "Confirmed", PENDING: "Pending", FAILED: "Failed" };
const primary = "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 text-base font-bold text-white hover:bg-[#14266a] disabled:bg-line disabled:text-muted";
const secondary = "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-navy hover:bg-cyan-soft";

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

export function PaymentResult() {
  const router = useRouter();
  const saved = useSavedPaymentCheck();
  const inFlight = useRef(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  async function recheck() {
    if (!saved || inFlight.current) return;
    inFlight.current = true;
    setChecking(true);
    setSaveError(false);
    try {
      const outcome = await submitPaymentCheck(saved.request);
      savePaymentCheck({ ...saved, outcome });
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }

  async function saveCase() {
    if (!saved || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      // Sessions saved by Phase 2 can still be opened and saved.
      const id = saved.checkId ?? JSON.stringify([saved.outcome.checkedAt, saved.request]);
      const issue = await saveIssue({ id, request: saved.request, outcome: saved.outcome });
      router.push(`/issues/${issue.id}`);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
      inFlight.current = false;
    }
  }

  if (!saved) {
    return (
      <section className="space-y-4 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-muted">Check a payment to see its result here.</p>
        <Link href="/check-payment" className={primary}>Check a Payment <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
    );
  }

  const { outcome, request } = saved;
  const { status } = outcome;
  const view = presentation[status];
  const evidence = "evidence" in outcome ? outcome.evidence : undefined;
  let description: string = view.description;
  if (status === "more_details_needed" && outcome.reason === "multiple_matches") {
    description = "Multiple records could match. Confirm the exact UPI reference before relying on a result.";
  } else if (status === "unavailable" && outcome.reason === "request_failed") {
    description = "The verification request didn’t complete. Try again to check the payment records.";
  } else if (status === "not_verified" && outcome.reason === "details_mismatch") {
    description = "The reference did not match the amount or demo date entered.";
  }

  return (
    <div className="space-y-4">
      <section aria-labelledby="verification-status" className="rounded-2xl border border-line bg-white px-4 py-4 text-center">
        <p className="text-xs font-semibold text-navy">Simulated verification</p>
        <Image
          className="mx-auto"
          src={`/assets/payment-status/${view.image}.png`}
          width={128}
          height={128}
          alt=""
          loading="eager"
        />
        <div role="status" aria-live="polite" aria-atomic="true">
          <h2 id="verification-status" className={cn("text-xl font-bold", view.tone)}>
            {checking ? "Checking payment…" : paymentStatusLabel[status]}
          </h2>
          {!checking && <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted">{description}</p>}
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{formatINR(request.amountRupees)}</p>
        <p className="mt-0.5 text-xs text-muted">{status === "received" ? "Confirmed amount" : "Submitted amount"}</p>
      </section>

      <section aria-labelledby="payment-evidence" className="rounded-2xl border border-line bg-white px-4 pt-4 pb-1">
        <h2 id="payment-evidence" className="text-base font-bold text-ink">Payment evidence</h2>
        <dl className="mt-1 divide-y divide-line text-sm">
          <EvidenceRow label="Source" value={evidenceSource(outcome)} />
          <EvidenceRow label={status === "unavailable" ? "Check attempted" : "Last checked"} value={`${formatDateTime(outcome.checkedAt)} IST`} />
          {evidence ? (
            <>
              <EvidenceRow label="UPI reference" value={evidence.upiReference} />
              <EvidenceRow label="Recorded status" value={providerLabels[evidence.providerStatus]} />
              <EvidenceRow label="Status observed" value={`${formatDateTime(evidence.statusObservedAt)} IST`} />
            </>
          ) : (
            <>
              <EvidenceRow label="Submitted time" value={`${formatDateTime(reportedPaymentTime(request))} IST`} />
              <EvidenceRow label="Submitted reference" value={request.upiReference ?? "None provided"} />
            </>
          )}
        </dl>
        {evidence && (
          <details className="group border-t border-line text-sm">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-semibold text-navy">
              View details <ChevronDown size={18} className="group-open:rotate-180" aria-hidden="true" />
            </summary>
            <dl className="divide-y divide-line">
              <EvidenceRow label="Transaction ID" value={evidence.id} />
              <EvidenceRow label="Transaction time" value={`${formatDateTime(evidence.transactionTimestamp)} IST`} />
            </dl>
          </details>
        )}
      </section>

      {view.steps.length > 0 && (
        <section aria-labelledby="next-steps" className="rounded-xl bg-cyan-soft p-4 text-sm text-navy">
          <h2 id="next-steps" className="flex items-center gap-2 font-bold"><Info size={18} aria-hidden="true" /> Next steps</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            {view.steps.map((step) => <li key={step}>{step}</li>)}
          </ul>
        </section>
      )}

      {!checking && (
        <TamilGuidance key={`${status}:${request.amountRupees}`} status={status} amountRupees={request.amountRupees} />
      )}

      <div className="space-y-2">
        {status === "received" ? (
          <Link href="/" className={primary}>Done <ArrowRight size={18} aria-hidden="true" /></Link>
        ) : status === "more_details_needed" ? (
          <Link href="/check-payment" className={primary}>Edit Payment Details <ArrowRight size={18} aria-hidden="true" /></Link>
        ) : (
          <button type="button" onClick={recheck} disabled={checking || saving} className={primary}>
            <RotateCcw size={18} aria-hidden="true" />
            {checking ? "Checking…" : status === "unavailable" ? "Try Again" : "Check Again"}
          </button>
        )}
        {status === "unavailable" && <Link href="/" className={secondary}>Back to Home</Link>}
        {status !== "received" && (
          <div className="space-y-1 text-center">
            <button type="button" onClick={saveCase} disabled={checking || saving} aria-describedby="issue-save-hint" className={cn(secondary, "disabled:bg-page disabled:text-muted")}>
              {saving ? "Saving issue…" : "Save as Issue"}
            </button>
            <p id="issue-save-hint" className="text-xs text-muted">Demo case saved in this browser only.</p>
            {saveError && <p role="alert" className="text-sm text-danger">Couldn’t save the case. Check that browser storage is available and try again.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
