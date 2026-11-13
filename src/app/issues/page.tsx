import { PageHeader } from "@/components/layout/page-header";
import { IssueList } from "@/components/issues/issue-list";
import { issues } from "@/data/issues";

export const metadata = { title: "Issues · Paytm Resolve" };

export default function IssuesPage() {
  return (
    <>
      <PageHeader title="Issues" description="Payment cases reported by customers. Demo data." />
      <IssueList issues={issues} />
    </>
  );
}
