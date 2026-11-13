import { PageHeader } from "@/components/layout/page-header";
import { BrowserIssueList } from "@/components/issues/saved-issue-lists";

export const metadata = { title: "Issues · Paytm Resolve" };

export default function IssuesPage() {
  return (
    <>
      <PageHeader title="Issues" description="Demo payment cases. New cases are saved in this browser." />
      <BrowserIssueList />
    </>
  );
}
