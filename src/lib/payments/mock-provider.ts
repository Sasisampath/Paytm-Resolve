import { merchant } from "@/data/merchant";
import { confirmedVerificationRecords } from "@/data/transactions";
import type { PaymentProvider, TrustedPaymentRecord } from "./types";
import { DEMO_PAYMENT_DATE } from "./validation";

const providerRecords: readonly TrustedPaymentRecord[] = [
  {
    id: "TX-DEMO-850",
    merchantId: merchant.id,
    amountPaise: 85_000,
    transactionTimestamp: `${DEMO_PAYMENT_DATE}T09:21:00+05:30`,
    upiReference: "990000000850",
    statusObservedAt: `${DEMO_PAYMENT_DATE}T09:24:00+05:30`,
    providerStatus: "PENDING",
    source: "provider_record",
  },
  {
    id: "TX-DEMO-650",
    merchantId: merchant.id,
    amountPaise: 65_000,
    transactionTimestamp: `${DEMO_PAYMENT_DATE}T09:38:00+05:30`,
    upiReference: "990000000650",
    statusObservedAt: `${DEMO_PAYMENT_DATE}T09:40:00+05:30`,
    providerStatus: "FAILED",
    source: "provider_record",
  },
  {
    id: "TX-DEMO-650-B",
    merchantId: merchant.id,
    amountPaise: 65_000,
    transactionTimestamp: `${DEMO_PAYMENT_DATE}T09:42:00+05:30`,
    upiReference: "990000000651",
    statusObservedAt: `${DEMO_PAYMENT_DATE}T09:44:00+05:30`,
    providerStatus: "FAILED",
    source: "provider_record",
  },
];

export const mockPaymentProvider: PaymentProvider = {
  async readRecords(request) {
    // This reserved synthetic reference exercises the same failure path as an unavailable provider.
    if (request.upiReference === "990000000503") throw new Error("Simulated provider outage.");
    return [...confirmedVerificationRecords, ...providerRecords];
  },
};
