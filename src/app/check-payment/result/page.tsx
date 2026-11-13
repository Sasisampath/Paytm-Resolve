import { PaymentResult } from "@/components/check-payment/payment-result";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Payment Status · Paytm Resolve" };

export default function PaymentResultPage() {
  return (
    <>
      <PageHeader title="Payment Status" backHref="/check-payment" backLabel="Back to Check Payment" />
      <PaymentResult />
    </>
  );
}
