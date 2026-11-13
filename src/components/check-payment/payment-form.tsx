"use client";

import { useState } from "react";
import { submitPaymentCheck, toPaymentCheckRequest, validatePaymentForm } from "@/lib/payment-check";
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
  const [values, setValues] = useState<PaymentFormValues>(empty);
  const [touched, setTouched] = useState<Partial<Record<keyof PaymentFormValues, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const errors = validatePaymentForm(values);
  const ready = Object.keys(errors).length === 0;
  const show = (k: keyof PaymentFormValues) => (attempted || touched[k] ? errors[k] : undefined);

  const set = (k: keyof PaymentFormValues) => (v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setNotice(false);
  };
  const blur = (k: keyof PaymentFormValues) => () => setTouched((t) => ({ ...t, [k]: true }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!ready) {
      setNotice(false);
      return;
    }
    // Phase 2 hooks in here via submitPaymentCheck(); today it reports "not connected".
    const outcome = await submitPaymentCheck(toPaymentCheckRequest(values));
    setNotice(outcome.status === "not_connected");
  }

  return (
    <>
      <VoiceInputCard />

      <div className="my-5 flex items-center gap-3 text-sm text-muted" role="separator">
        <span className="h-px flex-1 bg-line" />
        Or enter payment details
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
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
        <CheckPaymentAction ready={ready} notice={notice} />
      </form>

      <UPIReferenceHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
