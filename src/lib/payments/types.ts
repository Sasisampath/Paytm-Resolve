export type PaymentCheckRequest = {
  amountRupees: number;
  paymentDate: string;
  approximateTime: string;
  upiReference?: string;
};

export type VerificationRequest = Omit<PaymentCheckRequest, "amountRupees"> & {
  merchantId: string;
  amountPaise: number;
};

type RecordDetails = {
  id: string;
  merchantId: string;
  amountPaise: number;
  transactionTimestamp: string;
  upiReference: string;
  statusObservedAt: string;
};

type ProviderStatus = "SUCCESS" | "PENDING" | "FAILED";
type Evidence<Status extends ProviderStatus> = RecordDetails & {
  providerStatus: Status;
  source: Status extends "SUCCESS" ? "merchant_record" : "provider_record";
};

export type TrustedPaymentRecord = {
  [Status in ProviderStatus]: Evidence<Status>;
}[ProviderStatus];

type OutcomeDetails = { checkedAt: string; isSimulated: true };

export type PaymentCheckOutcome = OutcomeDetails & (
  | { status: "received"; evidence: Evidence<"SUCCESS"> }
  | { status: "pending"; evidence: Evidence<"PENDING"> }
  | { status: "failed"; evidence: Evidence<"FAILED"> }
  | { status: "not_verified"; reason: "no_match" | "details_mismatch" }
  | { status: "more_details_needed"; reason: "reference_required" | "multiple_matches" }
  | { status: "unavailable"; reason: "records_unavailable" | "request_failed" }
);

export interface PaymentProvider {
  readRecords(request: VerificationRequest): Promise<readonly TrustedPaymentRecord[]>;
}
