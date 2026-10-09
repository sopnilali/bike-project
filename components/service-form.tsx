"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FieldError, inputClass, labelClass } from "@/components/ui";
import type { Bike } from "@/lib/types";

const schema = z.object({
  bikeId: z.string().min(1, "Please select a bike"),
  serviceDate: z.string().min(1, "Service date is required"),
  description: z.string().min(5, "Describe the service (min 5 characters)"),
  status: z.enum(["pending", "in-progress", "done"], {
    message: "Select a valid status",
  }),
});

export type ServiceFormValues = z.infer<typeof schema>;

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ServiceForm({
  bikes,
  busy,
  serverError,
  defaultBikeId,
  onSubmit,
}: {
  bikes: Bike[];
  busy?: boolean;
  serverError?: string | null;
  defaultBikeId?: string;
  onSubmit: (values: ServiceFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bikeId: defaultBikeId ?? "",
      serviceDate: todayInput(),
      description: "",
      status: "pending",
    },
  });

  const disabled = busy || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="service-bike" className={labelClass}>
          Bike
        </label>
        <select id="service-bike" className={inputClass} {...register("bikeId")}>
          <option value="">Select a bike…</option>
          {bikes.map((b) => (
            <option key={b.bikeId} value={b.bikeId}>
              {b.brand} {b.model} ({b.year})
              {b.customer ? ` — ${b.customer.name}` : ""}
            </option>
          ))}
        </select>
        <FieldError message={errors.bikeId?.message} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="service-date" className={labelClass}>
            Service Date
          </label>
          <input
            id="service-date"
            type="date"
            className={inputClass}
            {...register("serviceDate")}
          />
          <FieldError message={errors.serviceDate?.message} />
        </div>
        <div>
          <label htmlFor="service-status" className={labelClass}>
            Status
          </label>
          <select
            id="service-status"
            className={inputClass}
            {...register("status")}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <FieldError message={errors.status?.message} />
        </div>
      </div>
      <div>
        <label htmlFor="service-desc" className={labelClass}>
          Service Description
        </label>
        <textarea
          id="service-desc"
          rows={4}
          className={inputClass}
          placeholder="e.g. Full service: engine oil, air filter, brake pads…"
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      {serverError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={disabled}>
          {disabled ? "Saving…" : "Create Service Record"}
        </Button>
      </div>
    </form>
  );
}
