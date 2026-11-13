"use client";

import { useId } from "react";
import { CircleHelp, CircleX } from "lucide-react";
import { sanitizeReference } from "@/lib/payment-check";

export function UPIReferenceField({
  value,
  onChange,
  onHelp,
}: {
  value: string;
  onChange: (next: string) => void;
  onHelp: () => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          UPI reference number <span className="font-normal text-muted">· Optional</span>
        </label>
        <button
          type="button"
          onClick={onHelp}
          aria-label="Where can I find the UPI reference number?"
          aria-haspopup="dialog"
          className="-my-2 -mr-2 flex size-11 items-center justify-center rounded-full text-navy hover:bg-cyan-soft"
        >
          <CircleHelp size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <div className="relative">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Enter reference number"
          value={value}
          onChange={(e) => onChange(sanitizeReference(e.target.value))}
          className="min-h-12 w-full scroll-mb-32 rounded-xl border border-line bg-white pl-4 pr-12 text-base text-ink placeholder:text-muted/70"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear reference number"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange("")}
            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-navy"
          >
            <CircleX size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
