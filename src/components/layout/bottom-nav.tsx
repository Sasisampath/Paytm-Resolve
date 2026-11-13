"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, House, ScanSearch, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Home", Icon: House },
  { href: "/check-payment", label: "Check Payment", Icon: ScanSearch },
  { href: "/issues", label: "Issues", Icon: ClipboardList },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:border-x"
    >
      <ul className="grid grid-cols-3">
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                  active ? "text-cyan" : "text-muted hover:text-navy",
                )}
              >
                <Icon size={24} strokeWidth={2} aria-hidden="true" />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
