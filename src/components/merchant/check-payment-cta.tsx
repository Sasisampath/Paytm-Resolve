import Link from "next/link";
import { ScanSearch } from "lucide-react";

export function CheckPaymentCta() {
  return (
    <section aria-labelledby="cta-title" className="mb-6 rounded-2xl bg-navy p-5 text-white">
      <h2 id="cta-title" className="text-xl font-bold">
        Payment issue?
      </h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-white/85">
        Customer says they&apos;ve paid, but you haven&apos;t received confirmation?
      </p>
      <Link
        href="/check-payment"
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 text-base font-bold text-navy transition-colors hover:bg-[#33c8f5] focus-visible:outline-white"
      >
        <ScanSearch size={22} strokeWidth={2} aria-hidden="true" />
        Check a Payment
      </Link>
    </section>
  );
}
