import type { PaymentFormValues } from "@/components/check-payment/types";
import type { VoiceReview } from "./extraction";

export function voiceFormValues(review: VoiceReview): PaymentFormValues | undefined {
  if (!review.extractionAvailable || review.missing.length === 3) return undefined;
  return {
    amount: review.amountRupees === null ? "" : String(review.amountRupees),
    approximateTime: review.approximateTime ?? "",
    upiReference: review.upiReference ?? "",
  };
}
