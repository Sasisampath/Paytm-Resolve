import type { PaymentCheckOutcome, PaymentCheckRequest } from "./types";

export const paymentStatusLabel: Record<PaymentCheckOutcome["status"], string> = {
  received: "Payment received",
  not_verified: "Payment not verified",
  pending: "Payment pending",
  failed: "Payment failed",
  unavailable: "Unable to verify",
  more_details_needed: "More details needed",
};

export function evidenceSource(outcome: PaymentCheckOutcome) {
  switch (outcome.status) {
    case "received": return "Simulated merchant record";
    case "pending":
    case "failed": return "Simulated provider record";
    case "unavailable": return "Records unavailable";
    default: return "Simulated merchant and provider records";
  }
}

export const reportedPaymentTime = (request: PaymentCheckRequest) =>
  `${request.paymentDate}T${request.approximateTime}:00+05:30`;
