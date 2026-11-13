import { CircleCheck } from "lucide-react";
import type { ConfirmedPayment } from "@/data/transactions";
import { formatINR, formatTime } from "@/lib/utils";

export function RecentPayments({ payments }: { payments: ConfirmedPayment[] }) {
  return (
    <section aria-labelledby="recent-title" className="mb-6">
      <h2 id="recent-title" className="mb-3 text-base font-bold text-ink">
        Recent payments
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {payments.map((p) => (
          <li key={p.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
            <CircleCheck size={24} strokeWidth={2} className="shrink-0 text-success" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-ink">{formatINR(p.amountRupees)}</p>
              <p className="text-sm font-medium text-success">Received</p>
            </div>
            <time dateTime={p.receivedAt} className="text-sm text-muted">
              {formatTime(p.receivedAt)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
