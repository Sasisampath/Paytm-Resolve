"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { savePaymentCheck, useSavedPaymentCheck } from "./payment-check-session";
import { submitPaymentCheck, toPaymentCheckRequest, validatePaymentForm } from "@/lib/payment-check";
import { voiceFormValues } from "@/lib/voice/form-review";
import type { VoiceReview } from "@/lib/voice/extraction";
import type { PaymentFormValues } from "./types";
import { CheckPaymentAction } from "./check-payment-action";
import { PaymentAmountInput } from "./payment-amount-input";
import { PaymentSafetyNote } from "./payment-safety-note";
import { PaymentTimeField } from "./payment-time-field";
import { UPIReferenceField } from "./upi-reference-field";
import { UPIReferenceHelpSheet } from "./upi-reference-help-sheet";
import { VoiceInputCard } from "./voice-input-card";

const empty: PaymentFormValues = { amount: "", approximateTime: "", upiReference: "" };

export function PaymentForm() {
  const router = useRouter();
  const saved = useSavedPaymentCheck();
  const [edits, setEdits] = useState<PaymentFormValues>();
  const values = edits ?? saved?.values ?? empty;
  const inFlight = useRef(false);
  const manualEdits = useRef(0);
  const [editVersion, setEditVersion] = useState(0);
  const [checking, setChecking] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof PaymentFormValues, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const errors = validatePaymentForm(values);
  const ready = Object.keys(errors).length === 0;
  const show = (k: keyof PaymentFormValues) => (attempted || touched[k] ? errors[k] : undefined);

  const set = (k: keyof PaymentFormValues) => (v: string) => {
    setEditVersion(++manualEdits.current);
    setEdits((prev) => ({ ...(prev ?? values), [k]: v }));
  };
  const blur = (k: keyof PaymentFormValues) => () => setTouched((t) => ({ ...t, [k]: true }));

  function onVoiceReview(review: VoiceReview) {
    const suggested = voiceFormValues(review);
    if (!suggested || inFlight.current || editVersion !== manualEdits.current) return false;
    setEdits(suggested);
    setTouched({});
    setAttempted(false);
    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!ready || inFlight.current) return;

    inFlight.current = true;
    setChecking(true);
    try {
      const request = toPaymentCheckRequest(values);
      const outcome = await submitPaymentCheck(request);
      savePaymentCheck({ checkId: crypto.randomUUID(), values, request, outcome });
      router.push("/check-payment/result");
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }

  return (
    <>
      <VoiceInputCard disabled={checking} onReview={onVoiceReview} />

      <div className="my-5 flex items-center gap-3 text-sm text-muted" role="separator">
        <span className="h-px flex-1 bg-line" />
        Or enter payment details
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} noValidate>
        <fieldset disabled={checking} className="min-w-0 space-y-5">
          <PaymentAmountInput
            value={values.amount}
            error={show("amount")}
            onChange={set("amount")}
            onBlur={blur("amount")}
          />
          <PaymentTimeField
            value={values.approximateTime}
            error={show("approximateTime")}
            onChange={set("approximateTime")}
            onBlur={blur("approximateTime")}
          />
          <UPIReferenceField
            value={values.upiReference}
            onChange={set("upiReference")}
            onHelp={() => setHelpOpen(true)}
          />
          <PaymentSafetyNote />
          <CheckPaymentAction ready={ready} checking={checking} />
        </fieldset>
      </form>

      <UPIReferenceHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
