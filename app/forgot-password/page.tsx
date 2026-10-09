"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench } from "lucide-react";
import { forgotPassword, getApiErrorMessage } from "@/lib/api";
import {
  Button,
  Card,
  FieldError,
  inputClass,
  labelClass,
} from "@/components/ui";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError(null);
    setMessage(null);
    setResetToken(null);
    try {
      const res = await forgotPassword(values.email);
      setMessage(res.message || "If that email exists, a reset token was issued (valid 1h).");
      if (res.resetToken) setResetToken(res.resetToken);
    } catch (err) {
      setServerError(getApiErrorMessage(err, "Request failed. Try again."));
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
        <h1 className="text-xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your account email. Calls{" "}
          <code className="font-mono text-xs">POST /api/auth/forgot-password</code>.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="forgot-email" className={labelClass}>
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="alex@example.com"
              className={inputClass}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
          {serverError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {serverError}
            </p>
          ) : null}
          {message ? (
            <p
              role="status"
              className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
            >
              {message}
            </p>
          ) : null}
          {resetToken ? (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Reset token (1h, dev only)
              </p>
              <p className="mt-1 break-all font-mono text-xs">{resetToken}</p>
              <Link
                href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                className="mt-2 inline-block text-sm font-bold text-blue-600 hover:underline"
              >
                Continue to reset →
              </Link>
            </div>
          ) : null}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Sending…" : "Send reset token"}
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
