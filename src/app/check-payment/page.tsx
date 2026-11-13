import { CheckPaymentHeader } from "@/components/check-payment/check-payment-header";
import { PaymentForm } from "@/components/check-payment/payment-form";

export const metadata = { title: "Check a Payment · Paytm Resolve" };

export default function CheckPaymentPage() {
  return (
    <>
      <CheckPaymentHeader />
      <PaymentForm />
    </>
  );
}
