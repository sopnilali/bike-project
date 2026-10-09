"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, UserPlus } from "lucide-react";
import {
  createUser,
  getApiErrorMessage,
  updateUserRole,
} from "@/lib/api";
import { canManageUsers } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { RequireRole } from "@/components/require-role";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  FieldError,
  PageHeader,
  inputClass,
  labelClass,
} from "@/components/ui";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(6, "Phone looks too short").max(20, "Phone looks too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["customer", "staff", "admin"]),
});

const roleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["customer", "staff", "admin"]),
});

type CreateValues = z.infer<typeof createSchema>;
type RoleValues = z.infer<typeof roleSchema>;

const ROLE_OPTIONS: UserRole[] = ["customer", "staff", "admin"];

function AdminUsersContent() {
  const toast = useToast();
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleOk, setRoleOk] = useState<string | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", role: "staff" },
  });
  const roleForm = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { userId: "", role: "staff" },
  });

  async function onCreate(values: CreateValues) {
    setCreateError(null);
    setCreateOk(null);
    try {
      const created = await createUser(values);
      setCreateOk(`${created.name} (${created.email}) created as ${created.role}.`);
      createForm.reset({ name: "", email: "", phone: "", password: "", role: "staff" });
      toast.success("User created.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to create user.");
      setCreateError(msg);
      toast.error(msg);
    }
  }

  async function onRoleChange(values: RoleValues) {
    setRoleError(null);
    setRoleOk(null);
    try {
      const updated = await updateUserRole(values.userId.trim(), values.role);
      setRoleOk(`${updated.name} (${updated.email}) is now ${updated.role}.`);
      toast.success("Role updated.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to update role.");
      setRoleError(msg);
      toast.error(msg);
    }
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="POST /api/auth/users and PATCH /api/auth/users/:id/role — admin only."
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <UserPlus className="h-4 w-4 text-blue-600" /> Create user with role
          </h2>
          <p className="text-xs text-slate-500">
            Public signup always creates customers — use this for staff/admin accounts.
          </p>
          <form
            onSubmit={createForm.handleSubmit(onCreate)}
            className="mt-4 space-y-4"
            noValidate
          >
            <div>
              <label htmlFor="admin-name" className={labelClass}>
                Full name
              </label>
              <input id="admin-name" className={inputClass} {...createForm.register("name")} />
              <FieldError message={createForm.formState.errors.name?.message} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="admin-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className={inputClass}
                  {...createForm.register("email")}
                />
                <FieldError message={createForm.formState.errors.email?.message} />
              </div>
              <div>
                <label htmlFor="admin-phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="admin-phone"
                  type="tel"
                  className={inputClass}
                  {...createForm.register("phone")}
                />
                <FieldError message={createForm.formState.errors.phone?.message} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="admin-password" className={labelClass}>
                  Password (min 6)
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  {...createForm.register("password")}
                />
                <FieldError message={createForm.formState.errors.password?.message} />
              </div>
              <div>
                <label htmlFor="admin-role" className={labelClass}>
                  Role
                </label>
                <select id="admin-role" className={inputClass} {...createForm.register("role")}>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <FieldError message={createForm.formState.errors.role?.message} />
              </div>
            </div>
            {createError ? (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {createError}
              </p>
            ) : null}
            {createOk ? (
              <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {createOk}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
                {createForm.formState.isSubmitting ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-blue-600" /> Change user role
          </h2>
          <p className="text-xs text-slate-500">
            Calls <code className="font-mono">PATCH /api/auth/users/:id/role</code> with{" "}
            <code className="font-mono">{"{ role }"}</code>.
          </p>
          <form
            onSubmit={roleForm.handleSubmit(onRoleChange)}
            className="mt-4 space-y-4"
            noValidate
          >
            <div>
              <label htmlFor="role-user-id" className={labelClass}>
                User ID
              </label>
              <input
                id="role-user-id"
                placeholder="Paste the user's id"
                className={`${inputClass} font-mono text-xs`}
                {...roleForm.register("userId")}
              />
              <FieldError message={roleForm.formState.errors.userId?.message} />
            </div>
            <div>
              <label htmlFor="role-role" className={labelClass}>
                New role
              </label>
              <select id="role-role" className={inputClass} {...roleForm.register("role")}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <FieldError message={roleForm.formState.errors.role?.message} />
            </div>
            {roleError ? (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {roleError}
              </p>
            ) : null}
            {roleOk ? (
              <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {roleOk}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                disabled={roleForm.formState.isSubmitting}
              >
                {roleForm.formState.isSubmitting ? "Saving…" : "Update role"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <RequireRole allow={canManageUsers}>
      <AdminUsersContent />
    </RequireRole>
  );
}
