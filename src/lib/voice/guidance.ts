import type { PaymentCheckOutcome } from "@/lib/payments/types";
import { formatINR } from "@/lib/utils";

const tamilGuidance: Record<PaymentCheckOutcome["status"], (amount: string) => string> = {
  received: (amount) => `உங்கள் கடையின் மாதிரிப் பணப் பதிவில் ${amount} பெறப்பட்டது உறுதியாகியுள்ளது.`,
  not_verified: () => "கிடைத்த மாதிரிப் பணப் பதிவுகளில் இந்தப் பணம் பெறப்பட்டதை உறுதிப்படுத்த முடியவில்லை. யுபிஐ குறிப்பு எண்ணைக் கேட்டு, உங்கள் கடையின் அதிகாரப்பூர்வப் பதிவைச் சரிபார்க்கவும்.",
  pending: () => "மாதிரிப் பணச் சேவை வழங்குநரின் பதிவில் இந்தப் பரிவர்த்தனை இன்னும் நிலுவையில் உள்ளது. இறுதி நிலை தெரியும்வரை அதே ஆர்டருக்கு மீண்டும் பணம் கேட்க வேண்டாம்.",
  failed: () => "மாதிரிப் பணச் சேவை வழங்குநரின் பதிவில் இந்தப் பண முயற்சி தோல்வியடைந்ததாக உள்ளது. மீண்டும் பணம் செலுத்தச் சொல்லும் முன் அதிகாரப்பூர்வப் பதிவில் சமீபத்திய நிலையைச் சரிபார்க்கவும்.",
  unavailable: () => "இப்போது பணப் பதிவுகளைச் சரிபார்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது உங்கள் கடையின் அதிகாரப்பூர்வப் பதிவைப் பார்க்கவும்.",
  more_details_needed: () => "இந்தப் பரிவர்த்தனையை அடையாளம் காண மேலும் விவரங்கள் தேவை. யுபிஐ குறிப்பு எண்ணையும் தொகையையும் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
};

export function isGuidanceStatus(value: unknown): value is PaymentCheckOutcome["status"] {
  return typeof value === "string" && Object.hasOwn(tamilGuidance, value);
}

export function getTamilGuidance(status: PaymentCheckOutcome["status"], amountRupees: number) {
  return tamilGuidance[status](formatINR(amountRupees));
}
