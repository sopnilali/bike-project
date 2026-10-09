"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast";
import { getApiErrorMessage } from "@/lib/api";
import {
  Button,
  Card,
  FieldError,
  inputClass,
  labelClass,
} from "@/components/ui";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(6, "Phone looks too short").max(20, "Phone looks too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type Values = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      await auth.signup(values);
      toast.success("Account created. Welcome!");
      router.replace("/");
    } catch (err) {
      setServerError(getApiErrorMessage(err, "Signup failed. Try again."));
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
        <h1 className="text-xl font-bold text-slate-900">Create staff account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Calls <code className="font-mono text-xs">POST /api/auth/signup</code>.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="signup-name" className={labelClass}>
              Full name
            </label>
            <input
              id="signup-name"
              autoComplete="name"
              placeholder="e.g. Alex Carter"
              className={inputClass}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <label htmlFor="signup-email" className={labelClass}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="alex@example.com"
              className={inputClass}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <label htmlFor="signup-phone" className={labelClass}>
              Phone
            </label>
            <input
              id="signup-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+880 1XXX XXXXXX"
              className={inputClass}
              {...register("phone")}
            />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <label htmlFor="signup-password" className={labelClass}>
              Password (min 6)
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputClass}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
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
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
