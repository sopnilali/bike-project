"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "./auth-provider";
import type { AuthUser } from "@/lib/types";
import { Button, Card, LoadingSpinner } from "./ui";

interface RequireRoleProps {
  /** Return true when the signed-in user may see the children. */
  allow: (user: AuthUser | null) => boolean;
  children: ReactNode;
}

/**
 * Client-side role gate. The backend still enforces authorization —
 * this only avoids useless 403 calls and hides staff UI from customers.
 */
export function RequireRole({ allow, children }: RequireRoleProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <LoadingSpinner label="Checking access…" />;

  if (!isAuthenticated || !allow(user)) {
    return (
      <Card className="p-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-6 w-6 text-amber-600" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          {!isAuthenticated ? "Please sign in" : "Not authorized"}
        </h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {!isAuthenticated
            ? "You need to sign in to view this page."
            : "Your account role does not have access to this page."}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {!isAuthenticated ? (
            <Link href="/login">
              <Button>Sign in</Button>
            </Link>
          ) : (
            <Link href="/">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          )}
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
