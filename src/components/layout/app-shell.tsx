import { BottomNav } from "./bottom-nav";

/** Centred mobile shell; on wide screens the app stays phone-width. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[480px] bg-page md:border-x md:border-line md:shadow-sm">
      <main className="px-4 pt-4 pb-[calc(88px+env(safe-area-inset-bottom))] sm:px-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
