import { CircleAlert, CircleCheck, Clock3 } from "lucide-react";
import { issueStatusMeta, type IssueStatus } from "@/data/issues";
import { cn } from "@/lib/utils";

const styles: Record<IssueStatus, { cls: string; Icon: typeof CircleAlert }> = {
  open: { cls: "bg-cyan-soft text-navy", Icon: Clock3 },
  not_verified: { cls: "bg-red-50 text-danger", Icon: CircleAlert },
  awaiting_status_check: { cls: "bg-amber-50 text-warning", Icon: Clock3 },
  resolved: { cls: "bg-green-50 text-success", Icon: CircleCheck },
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  const { cls, Icon } = styles[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {issueStatusMeta[status].label}
    </span>
  );
}
