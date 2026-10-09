"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Bike as BikeIcon,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  fetchBikes,
  fetchCustomers,
  fetchOverdueServices,
  fetchServices,
  getApiErrorMessage,
} from "@/lib/api";
import { isStaff } from "@/lib/roles";
import { useAuth } from "@/components/auth-provider";
import { formatDate, isOverdueService } from "@/lib/utils";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCards,
  StatusBadge,
} from "@/components/ui";
import { useToast } from "@/components/toast";

interface Stats {
  customers: number;
  bikes: number;
  services: number;
  pending: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export default function DashboardPage() {
  const toast = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const staff = isStaff(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    bikes: 0,
    services: 0,
    pending: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
  });
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof fetchServices>>>([]);
  const [overdue, setOverdue] = useState<Awaited<ReturnType<typeof fetchOverdueServices>>>([]);

  const load = useCallback(async () => {
    // Customers can't call staff-only endpoints — load bikes only.
    if (!authLoading && !staff) {
      setLoading(true);
      setError(null);
      try {
        const bikes = await fetchBikes();
        setStats({
          customers: 0,
          bikes: bikes.length,
          services: 0,
          pending: 0,
          inProgress: 0,
          done: 0,
          overdue: 0,
        });
        setRecent([]);
        setOverdue([]);
      } catch (err) {
        const msg = getApiErrorMessage(err, "Failed to load dashboard data.");
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [customers, bikes, services, overdueList] = await Promise.all([
        fetchCustomers(),
        fetchBikes(),
        fetchServices(),
        fetchOverdueServices().catch(() => []),
      ]);
      const pending = services.filter((s) => s.status === "pending").length;
      const inProgress = services.filter((s) => s.status === "in-progress").length;
      const done = services.filter((s) => s.status === "done").length;
      const overdueCount =
        overdueList.length > 0
          ? overdueList.length
          : services.filter((s) => isOverdueService(s.serviceDate, s.status)).length;

      setStats({
        customers: customers.length,
        bikes: bikes.length,
        services: services.length,
        pending,
        inProgress,
        done,
        overdue: overdueCount,
      });
      setRecent(
        [...services].sort(
          (a, b) => +new Date(b.serviceDate) - +new Date(a.serviceDate)
        ).slice(0, 6)
      );
      setOverdue(overdueList.slice(0, 6));
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load dashboard data.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast, authLoading, staff]);

  useEffect(() => {
    if (!authLoading) load();
  }, [load, authLoading]);

  const chartData = useMemo(
    () => [
      { name: "Pending", value: stats.pending, color: "#f59e0b" },
      { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
      { name: "Done", value: stats.done, color: "#10b981" },
    ],
    [stats]
  );

  const cards = [
    { label: "Total Customers", value: stats.customers, icon: Users, accent: "bg-blue-100 text-blue-700", staffOnly: true },
    { label: "Total Bikes", value: stats.bikes, icon: BikeIcon, accent: "bg-violet-100 text-violet-700", staffOnly: false },
    { label: "Service Records", value: stats.services, icon: Wrench, accent: "bg-slate-200 text-slate-700", staffOnly: true },
    { label: "Pending", value: stats.pending, icon: Clock, accent: "bg-amber-100 text-amber-700", staffOnly: true },
    { label: "Completed", value: stats.done, icon: CheckCircle2, accent: "bg-emerald-100 text-emerald-700", staffOnly: true },
    { label: "Overdue (>7d)", value: stats.overdue, icon: AlertTriangle, accent: "bg-red-100 text-red-700", staffOnly: true },
  ];
  const visibleCards = cards.filter((c) => staff || !c.staffOnly);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          staff
            ? "Overview of customers, bikes, and service jobs."
            : "Your bikes at a glance."
        }
        actions={
          staff ? (
            <>
              <Link href="/customers">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" /> Customer
                </Button>
              </Link>
              <Link href="/bikes">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" /> Bike
                </Button>
              </Link>
              <Link href="/services">
                <Button>
                  <Plus className="h-4 w-4" /> Service
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/bikes">
              <Button>
                <Plus className="h-4 w-4" /> Bike
              </Button>
            </Link>
          )
        }
      />

      {loading ? (
        <SkeletonCards count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.label} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">{c.label}</p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.accent}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    {c.value}
                  </p>
                </Card>
              );
            })}
          </div>

          {!staff ? (
            <Card className="mt-6 p-5">
              <h2 className="text-sm font-bold text-slate-900">Quick actions</h2>
              <p className="text-xs text-slate-500">Things you can do with your account.</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link href="/bikes" className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                  <BikeIcon className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-bold text-slate-900">My bikes</p>
                  <p className="text-xs text-slate-500">Register a new bike</p>
                </Link>
                <Link href="/profile" className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-bold text-slate-900">My profile</p>
                  <p className="text-xs text-slate-500">Update details & photo</p>
                </Link>
              </div>
            </Card>
          ) : (
            <>
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="p-5 xl:col-span-1">
              <h2 className="text-sm font-bold text-slate-900">Service status summary</h2>
              <p className="text-xs text-slate-500">Live data from the API.</p>
              {stats.services === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No service records yet.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={85} label>
                        {chartData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Link
                href="/services"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                View all services <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>

            <Card className="p-5 xl:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Recent service records</h2>
                  <p className="text-xs text-slate-500">Latest jobs by service date.</p>
                </div>
                <Link href="/services" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState
                  title="No service records"
                  description="Create your first service record to start tracking jobs."
                  action={
                    <Link href="/services">
                      <Button>Create service</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="py-2 pr-3 font-semibold">Bike</th>
                        <th className="py-2 pr-3 font-semibold">Date</th>
                        <th className="py-2 pr-3 font-semibold">Status</th>
                        <th className="py-2 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((s) => (
                        <tr key={s.serviceId} className="border-t border-slate-100">
                          <td className="py-2.5 pr-3 font-semibold text-slate-800">
                            {s.bike ? `${s.bike.brand} ${s.bike.model}` : s.bikeId.slice(0, 8)}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-600">{formatDate(s.serviceDate)}</td>
                          <td className="py-2.5 pr-3">
                            <StatusBadge status={s.status} />
                          </td>
                          <td className="max-w-[240px] truncate py-2.5 text-slate-600">
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

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-amber-200 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Overdue services
                </h2>
                <Link href="/overdue-services" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              {overdue.length === 0 ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-6 text-center text-sm font-medium text-emerald-700">
                  All clear — no overdue services.
                </p>
              ) : (
                <ul className="space-y-2">
                  {overdue.map((s) => (
                    <li
                      key={s.serviceId}
                      className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {s.bike ? `${s.bike.brand} ${s.bike.model}` : "Unknown bike"} · {formatDate(s.serviceDate)}
                        </p>
                        <p className="truncate text-xs text-slate-500">{s.description}</p>
                      </div>
                      <Link href={`/services/${s.serviceId}`} className="shrink-0 text-xs font-bold text-blue-700 hover:underline">
                        Open →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-bold text-slate-900">Quick actions</h2>
              <p className="text-xs text-slate-500">Common tasks for front-desk staff.</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Link href="/customers" className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-bold text-slate-900">Add customer</p>
                  <p className="text-xs text-slate-500">Register a new client</p>
                </Link>
                <Link href="/bikes" className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                  <BikeIcon className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-bold text-slate-900">Add bike</p>
                  <p className="text-xs text-slate-500">Link bike to owner</p>
                </Link>
                <Link href="/services" className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-bold text-slate-900">New service</p>
                  <p className="text-xs text-slate-500">Open a job card</p>
                </Link>
              </div>
            </Card>
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
