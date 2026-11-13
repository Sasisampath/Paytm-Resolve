import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Looks disabled until the form is valid, but stays pressable so a tap on an
 * incomplete form still explains what is missing.
 */
export function CheckPaymentAction({ ready, notice }: { ready: boolean; notice: boolean }) {
  return (
    <div>
      <button
        type="submit"
        aria-disabled={!ready}
        className={cn(
          "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-bold transition-colors",
          ready ? "bg-navy text-white hover:bg-[#14266a]" : "bg-line text-muted",
        )}
      >
        Check Payment
        <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
      </button>
      <div role="status" aria-live="polite">
        {notice && (
          <p className="mt-3 rounded-xl border border-line bg-cyan-soft p-3 text-sm leading-relaxed text-navy">
            Payment checking will be enabled in the next development phase. Your details are ready.
          </p>
        )}
      </div>
    </div>
  );
}
