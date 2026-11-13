"use client";

import { useId } from "react";
import { Clock3 } from "lucide-react";
import { DEMO_PAYMENT_DATE } from "@/lib/payments/validation";
import { cn } from "@/lib/utils";
import { FieldError } from "./field-error";

const demoDateLabel = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(DEMO_PAYMENT_DATE));

export function PaymentTimeField({
  value,
  error,
  onChange,
  onBlur,
}: {
  value: string;
  error?: string;
  onChange: (next: string) => void;
  onBlur: () => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        Approximate payment time
      </label>
      <div className="relative">
        <Clock3
          size={20}
          strokeWidth={2}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy"
          aria-hidden="true"
        />
        <input
          id={id}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker();
            } catch {}
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error && `${id}-error`, `${id}-hint`) || undefined}
          className={cn(
            "min-h-12 w-full scroll-mb-32 rounded-xl border bg-white pl-11 pr-4 text-base text-ink [&::-webkit-calendar-picker-indicator]:hidden",
            error ? "border-danger" : "border-line",
          )}
        />
      </div>
      <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
        Demo date: {demoDateLabel}. Enter the approximate time in IST.
      </p>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
