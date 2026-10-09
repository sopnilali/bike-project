"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { completeService, fetchService, getApiErrorMessage } from "@/lib/api";
import type { ServiceRecord } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Button, Card, ErrorState, LoadingSpinner, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/toast";


function ServiceDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();

  const [service, setService] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setService(await fetchService(id));
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load service record.");
      if (/not found/i.test(msg) || /404/.test(msg)) setNotFound(true);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComplete() {
    if (!service) return;
    setCompleting(true);
    try {
      const updated = await completeService(service.serviceId);
      setService((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success("Service marked as completed.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to complete service."));
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <LoadingSpinner label="Loading service record…" />
      </Card>
    );
  }

  if (notFound) {
    return (
      <Card className="p-10 text-center">
        <h1 className="text-lg font-bold text-slate-900">Service record not found</h1>
        <p className="mt-1 text-sm text-slate-500">The link may be incorrect or the record was removed.</p>
        <div className="mt-4 flex justify-center">
          <Link href="/services">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back to services
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (error || !service) {
    return <ErrorState message={error ?? "Service unavailable."} onRetry={load} />;
  }

  return (
    <div>
      <Link
        href="/services"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to services
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-slate-400">ID {service.serviceId}</p>
              <h1 className="mt-1 text-xl font-extrabold text-slate-900">Service Details</h1>
            </div>
            <StatusBadge status={service.status} />
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Service date</dt>
              <dd className="mt-1 text-sm font-bold text-slate-900">{formatDate(service.serviceDate)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Completion date</dt>
              <dd className="mt-1 text-sm font-bold text-slate-900">
                {service.completionDate ? formatDateTime(service.completionDate) : "Not completed yet"}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Description</p>
            <p className="mt-1 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              {service.description}
            </p>
          </div>

          {service.status !== "done" ? (
            <div className="mt-5">
              <Button onClick={handleComplete} disabled={completing}>
                <CheckCircle2 className="h-4 w-4" />
                {completing ? "Marking as completed…" : "Mark as Completed"}
              </Button>
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              This service is completed.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bike</p>
          {service.bike ? (
            <div className="mt-2">
              <p className="text-lg font-extrabold text-slate-900">
                {service.bike.brand} {service.bike.model}
              </p>
              <p className="text-sm text-slate-500">Year {service.bike.year}</p>
              <Link
                href={`/bikes/${service.bike.bikeId}`}
                className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
              >
                View bike →
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Bike {service.bikeId.slice(0, 8)} (details unavailable).</p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ServiceDetailsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading service…" />}>
      <ServiceDetailsContent />
    </Suspense>
  );
}
