"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2, Eye } from "lucide-react";
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  getApiErrorMessage,
  updateCustomer,
} from "@/lib/api";
import type { Customer } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  SkeletonTable,
} from "@/components/ui";
import { CustomerForm, type CustomerFormValues } from "@/components/customer-form";
import { useToast } from "@/components/toast";
import { inputClass } from "@/components/ui";

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; customer?: Customer } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCustomers(await fetchCustomers());
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load customers.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [customers, query]);

  async function handleSubmit(values: CustomerFormValues) {
    setSaving(true);
    setServerError(null);
    try {
      if (modal?.mode === "edit" && modal.customer) {
        const updated = await updateCustomer(modal.customer.customerId, values);
        setCustomers((prev) =>
          prev.map((c) => (c.customerId === updated.customerId ? updated : c))
        );
        toast.success("Customer updated successfully.");
      } else {
        const created = await createCustomer(values);
        setCustomers((prev) => [created, ...prev]);
        toast.success("Customer added successfully.");
      }
      setModal(null);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to save customer.");
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteCustomer(deleting.customerId);
      setCustomers((prev) => prev.filter((c) => c.customerId !== deleting.customerId));
      toast.success("Customer deleted.");
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete customer."));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customer${customers.length === 1 ? "" : "s"}`}
        actions={
          <Button onClick={() => { setServerError(null); setModal({ mode: "create" }); }}>
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        }
      />

      <Card className="mb-4 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone…"
            aria-label="Search customers"
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
          title={query ? "No matching customers" : "No customers yet"}
          description={query ? "Try a different search term." : "Add your first customer to get started."}
          action={
            !query ? (
              <Button onClick={() => setModal({ mode: "create" })}>
                <Plus className="h-4 w-4" /> Add Customer
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Registered</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.customerId} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/customers/${c.customerId}`}
                          aria-label={`View ${c.name}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          aria-label={`Edit ${c.name}`}
                          onClick={() => { setServerError(null); setModal({ mode: "edit", customer: c }); }}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          aria-label={`Delete ${c.name}`}
                          onClick={() => setDeleting(c)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Customer" : "Add Customer"}
      >
        <CustomerForm
          initial={modal?.customer ?? null}
          busy={saving}
          serverError={serverError}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete customer?"
        description={`This will permanently delete ${deleting?.name ?? "this customer"} and all related bikes and service records. This cannot be undone.`}
        busy={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
