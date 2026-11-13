import { Info } from "lucide-react";

export function PaymentSafetyNote() {
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-sm leading-relaxed text-muted">
      <Info size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-navy" aria-hidden="true" />
      <p>A payment screenshot alone cannot confirm that money reached your business.</p>
    </div>
  );
}
