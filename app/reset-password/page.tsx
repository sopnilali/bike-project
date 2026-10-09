"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench } from "lucide-react";
import { getApiErrorMessage, resetPassword } from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  FieldError,
  inputClass,
  labelClass,
} from "@/components/ui";

const schema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

type Values = z.infer<typeof schema>;

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const t = searchParams.get("token") ?? "";
    if (t) reset((prev) => ({ ...prev, token: t }));
  }, [searchParams, reset]);

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      await resetPassword(values);
      toast.success("Password reset. Please sign in.");
      router.replace("/login");
    } catch (err) {
      setServerError(getApiErrorMessage(err, "Reset failed. Token may be expired."));
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Wrench className="h-5 w-5" />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-slate-900">
          MotoCare
        </span>
      </div>
      <Card className="p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste the token from forgot-password. Calls{" "}
          <code className="font-mono text-xs">POST /api/auth/reset-password</code>.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="reset-token" className={labelClass}>
              Reset token
            </label>
            <input
              id="reset-token"
              placeholder="Paste reset token"
              className={`${inputClass} font-mono text-xs`}
              {...register("token")}
            />
            <FieldError message={errors.token?.message} />
          </div>
          <div>
            <label htmlFor="reset-password" className={labelClass}>
              New password (min 6)
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputClass}
              {...register("newPassword")}
            />
            <FieldError message={errors.newPassword?.message} />
          </div>
          {serverError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {serverError}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
            Back to login
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetContent />
    </Suspense>
  );
}
