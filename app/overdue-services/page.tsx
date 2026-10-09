"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { fetchOverdueServices, getApiErrorMessage } from "@/lib/api";
import type { ServiceRecord } from "@/lib/types";
import { daysSince, formatDate } from "@/lib/utils";
import { Card, EmptyState, ErrorState, PageHeader, SkeletonTable, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/toast";

export default function OverdueServicesPage() {
  const toast = useToast();
  const [items, setItems] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchOverdueServices());
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load overdue services.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Overdue Services"
        subtitle="Pending or in-progress jobs older than 7 days (GET /services/status)."
      />

      {loading ? (
        <SkeletonTable />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No overdue services"
          description="All pending jobs are within their 7-day window. Nice work."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => {
            const days = daysSince(s.serviceDate);
            return (
              <Card key={s.serviceId} className="border-amber-200 bg-amber-50/50 p-5">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={s.status} />
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {days}d overdue
                  </span>
                </div>
                <h2 className="mt-3 text-base font-extrabold text-slate-900">
                  {s.bike ? `${s.bike.brand} ${s.bike.model}` : "Unknown bike"}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{s.description}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Service date: {formatDate(s.serviceDate)}
                </p>
                <Link
                  href={`/services/${s.serviceId}`}
                  className="mt-3 inline-block text-sm font-bold text-blue-700 hover:underline"
                >
                  View service record →
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
