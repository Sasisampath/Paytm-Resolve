import Image from "next/image";
import { Bell } from "lucide-react";
import type { MerchantProfile } from "@/data/merchant";

export function MerchantHeader({ merchant }: { merchant: MerchantProfile }) {
  return (
    <header className="mb-6 flex items-center gap-3">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-cyan-soft">
        <Image
          src="/assets/merchant-store.png"
          alt=""
          width={512}
          height={512}
          className="size-14 max-w-none"
          priority
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">Good morning</p>
        <h1 className="truncate text-lg font-bold text-ink">{merchant.name}</h1>
      </div>
      <button
        type="button"
        aria-label="Notifications"
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy hover:bg-cyan-soft"
      >
        <Bell size={22} strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  );
}
