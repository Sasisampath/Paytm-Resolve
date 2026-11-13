"use client";

import { useId, useState } from "react";
import { CircleX } from "lucide-react";
import { groupAmount, sanitizeAmount } from "@/lib/payment-check";
import { cn } from "@/lib/utils";
import { FieldError } from "./field-error";

export function PaymentAmountInput({
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
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        Payment amount
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-navy"
        >
          ₹
        </span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="Enter amount"
          value={focused ? value : groupAmount(value)}
          onChange={(e) => onChange(sanitizeAmount(e.target.value.replace(/,/g, "")))}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "min-h-14 w-full scroll-mb-32 rounded-xl border bg-white pl-10 pr-12 text-2xl font-bold text-ink placeholder:text-base placeholder:font-normal placeholder:text-muted/70",
            error ? "border-danger" : "border-line",
          )}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear amount"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange("")}
            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-navy"
          >
            <CircleX size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
