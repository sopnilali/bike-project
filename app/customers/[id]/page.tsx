"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import {
  deleteCustomer,
  fetchBike,
  fetchBikes,
  fetchCustomer,
  fetchServices,
  getApiErrorMessage,
  updateCustomer,
} from "@/lib/api";
import type { Bike, Customer, ServiceRecord } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  LoadingSpinner,
  Modal,
  StatusBadge,
} from "@/components/ui";
import { CustomerForm, type CustomerFormValues } from "@/components/customer-form";
import { useToast } from "@/components/toast";


function CustomerDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const toast = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const c = await fetchCustomer(id);
      setCustomer(c);
      const allBikes = await fetchBikes();
      const mine = allBikes.filter((b) => b.customerId === id);
      // Enrich: fetchBike already includes customer; list already does. Use filtered.
      setBikes(mine);
      try {
        const allServices = await fetchServices();
        const bikeIds = new Set(mine.map((b) => b.bikeId));
        setServices(allServices.filter((s) => bikeIds.has(s.bikeId)));
      } catch {
        setServices([]);
      }
      // Touch fetchBike import for potential enrichment (kept for future use)
      void fetchBike;
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load customer.");
      if (/not found/i.test(msg) || /404/.test(msg)) setNotFound(true);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleEdit(values: CustomerFormValues) {
    if (!customer) return;
    setSaving(true);
    setServerError(null);
    try {
      const updated = await updateCustomer(customer.customerId, values);
      setCustomer(updated);
      setEditOpen(false);
      toast.success("Customer updated.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to update customer.");
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!customer) return;
    setDeleteBusy(true);
    try {
      await deleteCustomer(customer.customerId);
      toast.success("Customer deleted.");
      router.push("/customers");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete customer."));
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <LoadingSpinner label="Loading customer…" />
      </Card>
    );
  }

  if (notFound) {
    return (
      <Card className="p-10 text-center">
        <h1 className="text-lg font-bold text-slate-900">Customer not found</h1>
        <p className="mt-1 text-sm text-slate-500">
          This record may have been deleted or the link is incorrect.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/customers">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back to customers
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (error || !customer) {
    return <ErrorState message={error ?? "Customer unavailable."} onRetry={load} />;
  }

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-extrabold text-white">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">{customer.name}</h1>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</dt>
              <dd className="font-medium text-slate-800">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</dt>
              <dd className="font-medium text-slate-800">{customer.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Registered</dt>
              <dd className="font-medium text-slate-800">{formatDateTime(customer.createdAt)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { setServerError(null); setEditOpen(true); }}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Registered bikes ({bikes.length})
              </h2>
              <Link href={`/bikes?customer=${customer.customerId}`}>
                <Button variant="secondary">
                  <Plus className="h-4 w-4" /> Add bike
                </Button>
              </Link>
            </div>
            {bikes.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No bikes registered for this customer yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {bikes.map((b) => (
                  <li key={b.bikeId} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {b.brand} {b.model}
                      </p>
                      <p className="text-xs text-slate-500">Year {b.year}</p>
                    </div>
                    <Link
                      href={`/bikes/${b.bikeId}`}
                      className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                      View bike →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-base font-bold text-slate-900">
              Service records ({services.length})
            </h2>
            {services.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No service records found for this customer&apos;s bikes.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Bike</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.serviceId} className="border-t border-slate-100">
                        <td className="py-2.5 pr-3 text-slate-600">{formatDate(s.serviceDate)}</td>
                        <td className="py-2.5 pr-3 font-medium text-slate-800">
                          {s.bike ? `${s.bike.brand} ${s.bike.model}` : s.bikeId.slice(0, 8)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="py-2.5">
                          <Link href={`/services/${s.serviceId}`} className="hover:text-blue-700 hover:underline">
                            {s.description}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Customer">
        <CustomerForm
          initial={customer}
          busy={saving}
          serverError={serverError}
          onSubmit={handleEdit}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete customer?"
        description={`Delete ${customer.name}? Their bikes and service history will also be removed.`}
        busy={deleteBusy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function CustomerDetailsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading customer…" />}>
      <CustomerDetailsContent />
    </Suspense>
  );
}
