"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FieldError, inputClass, labelClass } from "@/components/ui";
import type { Customer } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .min(6, "Phone number looks too short")
    .max(20, "Phone number looks too long"),
});

export type CustomerFormValues = z.infer<typeof schema>;

export function CustomerForm({
  initial,
  busy,
  serverError,
  onSubmit,
}: {
  initial?: Customer | null;
  busy?: boolean;
  serverError?: string | null;
  onSubmit: (values: CustomerFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
    });
  }, [initial, reset]);

  const disabled = busy || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor="customer-name" className={labelClass}>
          Full Name
        </label>
        <input
          id="customer-name"
          className={inputClass}
          placeholder="e.g. Alex Carter"
          autoComplete="name"
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>
      <div>
        <label htmlFor="customer-email" className={labelClass}>
          Email Address
        </label>
        <input
          id="customer-email"
          type="email"
          className={inputClass}
          placeholder="alex@example.com"
          autoComplete="email"
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <label htmlFor="customer-phone" className={labelClass}>
          Phone Number
        </label>
        <input
          id="customer-phone"
          type="tel"
          className={inputClass}
          placeholder="+880 1XXX XXXXXX"
          autoComplete="tel"
          {...register("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      {serverError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={disabled}>
          {disabled ? "Saving…" : initial ? "Save Changes" : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
