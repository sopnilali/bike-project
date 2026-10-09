"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { fetchBike, fetchServices, getApiErrorMessage } from "@/lib/api";
import type { Bike, ServiceRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button, Card, ErrorState, LoadingSpinner, StatusBadge } from "@/components/ui";


function BikeDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [bike, setBike] = useState<Bike | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const b = await fetchBike(id);
      setBike(b);
      try {
        const all = await fetchServices();
        setServices(all.filter((s) => s.bikeId === id));
      } catch {
        setServices([]);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load bike.");
      if (/not found/i.test(msg) || /404/.test(msg)) setNotFound(true);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card className="p-6">
        <LoadingSpinner label="Loading bike…" />
      </Card>
    );
  }

  if (notFound) {
    return (
      <Card className="p-10 text-center">
        <h1 className="text-lg font-bold text-slate-900">Bike not found</h1>
        <p className="mt-1 text-sm text-slate-500">The link may be incorrect or the bike was removed.</p>
        <div className="mt-4 flex justify-center">
          <Link href="/bikes">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back to bikes
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (error || !bike) {
    return <ErrorState message={error ?? "Bike unavailable."} onRetry={load} />;
  }

  return (
    <div>
      <Link
        href="/bikes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to bikes
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bike</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            {bike.brand} {bike.model}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manufacturing year {bike.year}</p>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Owner</p>
            {bike.customer ? (
              <div className="mt-1">
                <p className="text-sm font-bold text-slate-900">{bike.customer.name}</p>
                <p className="text-xs text-slate-500">{bike.customer.email} · {bike.customer.phone}</p>
                <Link
                  href={`/customers/${bike.customer.customerId}`}
                  className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline"
                >
                  View customer →
                </Link>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Owner information unavailable.</p>
            )}
          </div>

          <div className="mt-5">
            <Link href={`/services?bike=${bike.bikeId}`}>
              <Button>
                <Plus className="h-4 w-4" /> Create service record
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900">
            Service history ({services.length})
          </h2>
          {services.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No service history for this bike yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {services
                .slice()
                .sort((a, b) => +new Date(b.serviceDate) - +new Date(a.serviceDate))
                .map((s) => (
                  <li
                    key={s.serviceId}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{s.description}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(s.serviceDate)}
                        {s.completionDate ? ` · Completed ${formatDate(s.completionDate)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={s.status} />
                      <Link
                        href={`/services/${s.serviceId}`}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Open →
                      </Link>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function BikeDetailsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading bike…" />}>
      <BikeDetailsContent />
    </Suspense>
  );
}
