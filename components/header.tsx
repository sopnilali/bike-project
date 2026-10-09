"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "./auth-provider";
import { ProfilePhoto } from "./profile-photo";

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "Dashboard"],
  [/^\/customers\/[^/]+$/, "Customer Details"],
  [/^\/customers$/, "Customers"],
  [/^\/bikes\/[^/]+$/, "Bike Details"],
  [/^\/bikes$/, "Bikes"],
  [/^\/services\/[^/]+$/, "Service Details"],
  [/^\/services$/, "Service Records"],
  [/^\/overdue-services$/, "Overdue Services"],
  [/^\/profile$/, "My Profile"],
  [/^\/login$/, "Staff Login"],
  [/^\/signup$/, "Create Account"],
  [/^\/forgot-password$/, "Forgot Password"],
  [/^\/reset-password$/, "Reset Password"],
];

export function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, photoVersion } = useAuth();
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
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="hidden max-w-[180px] truncate rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 sm:inline"
              title={user.email}
            >
              {user.name || user.email}
            </Link>
            <Link
              href="/profile"
              aria-label="Open profile"
              className="block rounded-full hover:ring-2 hover:ring-blue-200"
            >
              <ProfilePhoto
                userId={user.id}
                hasPhoto={user.photoUrl != null}
                version={photoVersion}
                label={user.name || user.email}
              />
            </Link>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
            >
              Sign in
            </Link>
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
            >
              S
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
