import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, StickyNote, History, LineChart, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV: ReadonlyArray<{
  to: "/" | "/notes" | "/history" | "/overview";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/history", label: "History", icon: History },
  { to: "/overview", label: "Overview", icon: LineChart },
];

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary transition-all group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_var(--color-glow)]">
              <Shield className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Overwatch
              </span>
              <span className="font-display text-lg font-bold tracking-wide text-foreground">
                Competitive Journal
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-display">{item.label}</span>
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-primary shadow-[0_0_10px_var(--color-glow)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Mobile tabs */}
        <nav className="flex items-center justify-around border-t border-border/60 px-2 py-2 md:hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-md py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}