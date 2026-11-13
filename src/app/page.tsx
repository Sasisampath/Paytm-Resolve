import { MerchantHeader } from "@/components/merchant/merchant-header";
import { CheckPaymentCta } from "@/components/merchant/check-payment-cta";
import { OverviewCards } from "@/components/merchant/overview-cards";
import { RecentPayments } from "@/components/payments/recent-payments";
import { NeedsAttention } from "@/components/issues/needs-attention";
import { merchant } from "@/data/merchant";
import { getRecentPayments, getReceivedTotal } from "@/data/transactions";
import { getOpenIssues } from "@/data/issues";

export default function HomePage() {
  const openIssues = getOpenIssues();
  return (
    <>
      <MerchantHeader merchant={merchant} />
      <CheckPaymentCta />
      <OverviewCards receivedRupees={getReceivedTotal()} openIssues={openIssues.length} />
      <RecentPayments payments={getRecentPayments(3)} />
      <NeedsAttention issues={openIssues} />
    </>
  );
}
