"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, Plus, Search } from "lucide-react";
import {
  completeService,
  createService,
  fetchBikes,
  fetchServices,
  getApiErrorMessage,
} from "@/lib/api";
import type { Bike, ServiceRecord } from "@/lib/types";
import { formatDate, shortId } from "@/lib/utils";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  SkeletonTable,
  StatusBadge,
  inputClass,
} from "@/components/ui";
import { ServiceForm, type ServiceFormValues } from "@/components/service-form";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["all", "pending", "in-progress", "done"] as const;

function ServicesContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const preselectedBike = searchParams.get("bike") ?? "";

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [date, setDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, b] = await Promise.all([fetchServices(), fetchBikes()]);
      setServices(s);
      setBikes(b);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load service records."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (preselectedBike) setModalOpen(true);
  }, [preselectedBike]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (date) {
        const day = new Date(s.serviceDate).toISOString().slice(0, 10);
        if (day !== date) return false;
      }
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const bikeLabel = s.bike ? `${s.bike.brand} ${s.bike.model}`.toLowerCase() : "";
      return (
        s.description.toLowerCase().includes(q) ||
        bikeLabel.includes(q) ||
        s.serviceId.toLowerCase().includes(q)
      );
    });
  }, [services, status, date, query]);

  async function handleCreate(values: ServiceFormValues) {
    setSaving(true);
    setServerError(null);
    try {
      const created = await createService(values);
      setServices((prev) => [created, ...prev]);
      toast.success("Service record created.");
      setModalOpen(false);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to create service record.");
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(id: string) {
    setCompleting(id);
    try {
      const updated = await completeService(id);
      setServices((prev) => prev.map((s) => (s.serviceId === id ? { ...s, ...updated } : s)));
      toast.success("Service marked as completed.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to complete service."));
    } finally {
      setCompleting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Service Records"
        subtitle={`${services.length} total job${services.length === 1 ? "" : "s"}`}
        actions={
          <Button onClick={() => { setServerError(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> New Service
          </Button>
        }
      />

      <Card className="mb-4 space-y-3 p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by description, bike, or service ID…"
            aria-label="Search services"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold capitalize",
                  status === f
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <label htmlFor="service-date-filter" className="text-xs font-semibold text-slate-500">
              Service date
            </label>
            <input
              id="service-date-filter"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputClass} w-auto`}
            />
            {date ? (
              <button onClick={() => setDate("")} className="text-xs font-bold text-blue-600 hover:underline">
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      {loading ? (
        <SkeletonTable />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={services.length === 0 ? "No service records" : "No matching records"}
          description={services.length === 0 ? "Create your first service job to start tracking." : "Adjust filters or search terms."}
          action={
            services.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" /> New Service
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Service ID</th>
                  <th className="px-4 py-3 font-semibold">Bike</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Service Date</th>
                  <th className="px-4 py-3 font-semibold">Completion</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.serviceId} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{shortId(s.serviceId)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {s.bike ? `${s.bike.brand} ${s.bike.model}` : s.bikeId.slice(0, 8)}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">{s.description}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(s.serviceDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{s.completionDate ? formatDate(s.completionDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/services/${s.serviceId}`}
                          aria-label="View service details"
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {s.status !== "done" ? (
                          <button
                            onClick={() => handleComplete(s.serviceId)}
                            disabled={completing === s.serviceId}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {completing === s.serviceId ? "…" : "Done"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Service Record">
        {bikes.length === 0 && !loading ? (
          <div className="rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Add a bike before creating a service record.{" "}
            <Link href="/bikes" className="font-bold underline">
              Go to bikes →
            </Link>
          </div>
        ) : (
          <ServiceForm
            bikes={bikes}
            busy={saving}
            serverError={serverError}
            defaultBikeId={preselectedBike || undefined}
            onSubmit={handleCreate}
          />
        )}
      </Modal>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<SkeletonTable />}>
      <ServicesContent />
    </Suspense>
  );
}
