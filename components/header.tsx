"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "Dashboard"],
  [/^\/customers\/[^/]+$/, "Customer Details"],
  [/^\/customers$/, "Customers"],
  [/^\/bikes\/[^/]+$/, "Bike Details"],
  [/^\/bikes$/, "Bikes"],
  [/^\/services\/[^/]+$/, "Service Details"],
  [/^\/services$/, "Service Records"],
  [/^\/overdue-services$/, "Overdue Services"],
];

export function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const title =
    TITLES.find(([re]) => re.test(pathname))?.[1] ?? "MotoCare";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
            {title}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Bike Servicing Management Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:inline">
            Staff
          </span>
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
          >
            S
          </span>
        </div>
      </div>
    </header>
  );
}
