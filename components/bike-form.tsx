"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FieldError, inputClass, labelClass } from "@/components/ui";
import type { Customer } from "@/lib/types";

const currentYear = new Date().getFullYear();

const schema = z.object({
  brand: z.string().min(2, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(1980, "Year looks too old")
    .max(currentYear + 1, `Year cannot be after ${currentYear + 1}`),
  customerId: z.string().min(1, "Please select a customer"),
});

export type BikeFormValues = z.infer<typeof schema>;

export function BikeForm({
  customers,
  busy,
  serverError,
  defaultCustomerId,
  onSubmit,
}: {
  customers: Customer[];
  busy?: boolean;
  serverError?: string | null;
  defaultCustomerId?: string;
  onSubmit: (values: BikeFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // zod v4 + coerce makes the resolver input type `unknown` for `year`;
    // cast keeps useForm output typed as BikeFormValues.
  } = useForm<BikeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      brand: "",
      model: "",
      year: currentYear as unknown as number,
      customerId: defaultCustomerId ?? "",
    },
  });

  const disabled = busy || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bike-brand" className={labelClass}>
            Brand
          </label>
          <input
            id="bike-brand"
            className={inputClass}
            placeholder="e.g. Yamaha"
            {...register("brand")}
          />
          <FieldError message={errors.brand?.message} />
        </div>
        <div>
          <label htmlFor="bike-model" className={labelClass}>
            Model
          </label>
          <input
            id="bike-model"
            className={inputClass}
            placeholder="e.g. R15 V4"
            {...register("model")}
          />
          <FieldError message={errors.model?.message} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bike-year" className={labelClass}>
            Manufacturing Year
          </label>
          <input
            id="bike-year"
            type="number"
            className={inputClass}
            placeholder={String(currentYear)}
            {...register("year")}
          />
          <FieldError message={errors.year?.message} />
        </div>
        <div>
          <label htmlFor="bike-customer" className={labelClass}>
            Customer
          </label>
          <select
            id="bike-customer"
            className={inputClass}
            {...register("customerId")}
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.customerId} value={c.customerId}>
                {c.name} — {c.email}
              </option>
            ))}
          </select>
          <FieldError message={errors.customerId?.message} />
        </div>
      </div>

      {serverError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={disabled}>
          {disabled ? "Saving…" : "Add Bike"}
        </Button>
      </div>
    </form>
  );
}
