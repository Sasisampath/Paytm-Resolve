import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** An incomplete form still accepts a tap so it can explain what is missing. */
export function CheckPaymentAction({ ready, checking }: { ready: boolean; checking: boolean }) {
  return (
    <div>
      <button
        type="submit"
        disabled={checking}
        aria-disabled={!ready || checking}
        className={cn(
          "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-bold transition-colors",
          ready && !checking ? "bg-navy text-white hover:bg-[#14266a]" : "bg-line text-muted",
        )}
      >
        {checking ? "Checking payment…" : "Check Payment"}
        {!checking && <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />}
      </button>
      <span className="sr-only" role="status">{checking ? "Checking payment" : ""}</span>
    </div>
  );
}
