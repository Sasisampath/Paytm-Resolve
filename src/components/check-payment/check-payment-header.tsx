"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function CheckPaymentHeader() {
  const router = useRouter();
  // Go back if there is history; otherwise land on Home.
  const goBack = () => (window.history.length > 1 ? router.back() : router.push("/"));

  return (
    <header className="mb-5">
      <button
        type="button"
        onClick={goBack}
        aria-label="Go back"
        className="-ml-2 mb-1 flex size-11 items-center justify-center rounded-full text-navy hover:bg-cyan-soft"
      >
        <ArrowLeft size={24} strokeWidth={2} aria-hidden="true" />
      </button>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-ink">Check a Payment</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Enter the payment details to check available merchant records.
          </p>
        </div>
        <Image
          src="/assets/payment-search.png"
          alt=""
          width={400}
          height={374}
          className="h-auto w-24 shrink-0"
          priority
        />
      </div>
    </header>
  );
}
