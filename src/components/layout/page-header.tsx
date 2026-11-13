import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-navy hover:bg-cyan-soft"
        >
          <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
          {backLabel ?? "Back"}
        </Link>
      )}
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {description && <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>}
    </header>
  );
}
