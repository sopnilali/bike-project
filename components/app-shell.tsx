"use client";

import { Suspense, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ToastProvider } from "./toast";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-100 text-slate-900">
        <Suspense fallback={null}>
          <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<div className="h-[57px] border-b border-slate-200 bg-white" />}>
            <Header onMenu={() => setMobileOpen(true)} />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
          <footer className="px-6 pb-6 text-center text-xs text-slate-400">
            MotoCare Service Center · Built with Next.js + Tailwind
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
