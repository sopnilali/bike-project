"use client";

import { Suspense, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ToastProvider } from "./toast";
import { AuthProvider } from "./auth-provider";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
}

function ShellContent({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const bare = isAuthRoute(pathname ?? "");

  if (bare) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="px-6 pb-6 text-center text-xs text-slate-400">
          MotoCare Service Center · Built with Next.js + Tailwind
        </footer>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
              Loading…
            </div>
          }
        >
          <ShellContent>{children}</ShellContent>
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  );
}
