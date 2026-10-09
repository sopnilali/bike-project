"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bike as BikeIcon,
  Wrench,
  AlertTriangle,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/customers", label: "Customers", icon: Users, exact: false },
  { href: "/bikes", label: "Bikes", icon: BikeIcon, exact: false },
  { href: "/services", label: "Service Records", icon: Wrench, exact: false },
  {
    href: "/overdue-services",
    label: "Overdue Services",
    icon: AlertTriangle,
    exact: true,
  },
  { href: "/profile", label: "My Profile", icon: User, exact: true },
];

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight text-slate-900">
                MotoCare
              </span>
              <span className="block text-xs font-medium text-slate-500">
                Service Center
              </span>
            </span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Primary">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-4">
          {isAuthenticated && user ? (
            <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              <p className="truncate font-semibold text-slate-700">{user.name}</p>
              <p className="truncate">{user.email}</p>
              <button
                onClick={logout}
                className="mt-2 text-xs font-bold text-red-600 hover:underline"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              <p className="font-semibold text-slate-700">Staff workspace</p>
              <p>
                <Link href="/login" className="font-bold text-blue-600 hover:underline">
                  Sign in
                </Link>{" "}
                to access all features.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
