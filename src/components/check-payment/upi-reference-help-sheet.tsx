"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

/** Bottom sheet on a native <dialog>: Escape, focus trap and backdrop for free. */
export function UPIReferenceHelpSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="upi-help-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop click
      }}
      className="sheet fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white p-0 text-ink backdrop:bg-black/40"
    >
      <div className="p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <h2 id="upi-help-title" className="text-lg font-bold leading-snug">
            Where can I find the UPI reference number?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-navy hover:bg-cyan-soft"
          >
            <X size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Open the transaction details in your payment app and look for the UPI reference or
          transaction reference number.
        </p>
        <Image
          src="/assets/upi-reference-guide.png"
          alt="A UPI transaction screen with the Ref No line highlighted"
          width={720}
          height={540}
          className="mx-auto my-4 h-auto w-full max-w-[320px]"
        />
        <p className="rounded-xl bg-cyan-soft p-3 text-sm leading-relaxed text-navy">
          The reference number helps identify a transaction but does not by itself confirm payment
          receipt.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-12 w-full rounded-xl bg-navy px-4 text-base font-bold text-white hover:bg-[#14266a]"
        >
          Got it
        </button>
      </div>
    </dialog>
  );
}
