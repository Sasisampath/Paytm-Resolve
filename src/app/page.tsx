import { MerchantHeader } from "@/components/merchant/merchant-header";
import { CheckPaymentCta } from "@/components/merchant/check-payment-cta";
import { MerchantActivity } from "@/components/issues/saved-issue-lists";
import { merchant } from "@/data/merchant";
import { getRecentPayments, getReceivedTotal } from "@/data/transactions";

export default function HomePage() {
  return (
    <>
      <MerchantHeader merchant={merchant} />
      <CheckPaymentCta />
      <MerchantActivity receivedRupees={getReceivedTotal()} recentPayments={getRecentPayments(3)} />
    </>
  );
}
