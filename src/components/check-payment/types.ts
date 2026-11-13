/** Raw values as typed by the merchant (all strings, UI state). */
export interface PaymentFormValues {
  /** Digits with an optional decimal part, no grouping commas. e.g. "2000" or "850.50" */
  amount: string;
  /** "HH:mm" 24-hour from the native time input. */
  approximateTime: string;
  /** Optional, digits only. Empty string when not given. */
  upiReference: string;
}

export type PaymentFormErrors = Partial<Record<keyof PaymentFormValues, string>>;
export type { PaymentCheckOutcome, PaymentCheckRequest } from "@/lib/payments/types";
