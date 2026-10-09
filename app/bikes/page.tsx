"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, Plus, Search } from "lucide-react";
import { createBike, fetchBikes, fetchCustomers, getApiErrorMessage } from "@/lib/api";
import type { Bike, Customer } from "@/lib/types";
import { Button, Card, EmptyState, ErrorState, Modal, PageHeader, SkeletonTable, inputClass } from "@/components/ui";
import { BikeForm, type BikeFormValues } from "@/components/bike-form";
import { useToast } from "@/components/toast";

function BikesContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get("customer") ?? "";

  const [bikes, setBikes] = useState<Bike[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, c] = await Promise.all([fetchBikes(), fetchCustomers()]);
      setBikes(b);
      setCustomers(c);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load bikes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (preselectedCustomer) setModalOpen(true);
  }, [preselectedCustomer]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bikes;
    return bikes.filter(
      (b) =>
        b.brand.toLowerCase().includes(q) ||
        b.model.toLowerCase().includes(q) ||
        b.customer?.name.toLowerCase().includes(q) ||
        String(b.year).includes(q)
    );
  }, [bikes, query]);

  async function handleSubmit(values: BikeFormValues) {
    setSaving(true);
    setServerError(null);
    try {
      const created = await createBike(values);
      // Attach customer object for immediate display
      const owner = customers.find((c) => c.customerId === created.customerId);
      setBikes((prev) => [{ ...created, customer: owner ?? created.customer }, ...prev]);
      toast.success("Bike added successfully.");
      setModalOpen(false);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to add bike.");
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Bikes"
        subtitle={`${bikes.length} registered bike${bikes.length === 1 ? "" : "s"}`}
        actions={
          <Button onClick={() => { setServerError(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Bike
          </Button>
        }
      />

      <Card className="mb-4 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand, model, or owner…"
            aria-label="Search bikes"
            className={`${inputClass} pl-9`}
          />
        </div>
      </Card>

      {loading ? (
        <SkeletonTable />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "No matching bikes" : "No bikes yet"}
          description={query ? "Try a different search term." : "Register a bike for a customer to get started."}
          action={
            !query ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" /> Add Bike
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bike</th>
                  <th className="px-4 py-3 font-semibold">Year</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.bikeId} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {b.brand} {b.model}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.year}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.customer ? (
                        <Link href={`/customers/${b.customer.customerId}`} className="font-medium text-slate-800 hover:text-blue-700 hover:underline">
                          {b.customer.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/bikes/${b.bikeId}`}
                          aria-label={`View ${b.brand} ${b.model}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Bike">
        {customers.length === 0 && !loading ? (
          <div className="rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
            You need at least one customer before adding a bike.{" "}
            <Link href="/customers" className="font-bold underline">
              Add a customer first →
            </Link>
          </div>
        ) : (
          <BikeForm
            customers={customers}
            busy={saving}
            serverError={serverError}
            defaultCustomerId={preselectedCustomer || undefined}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>
    </div>
  );
}

export default function BikesPage() {
  return (
    <Suspense fallback={<SkeletonTable />}>
      <BikesContent />
    </Suspense>
  );
}
