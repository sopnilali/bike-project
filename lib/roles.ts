import type { AuthUser, UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  staff: "Staff",
  admin: "Admin",
};

export function isStaff(user: AuthUser | null): boolean {
  return user?.role === "staff" || user?.role === "admin";
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "admin";
}

/** GET /customers — staff, admin */
export function canViewCustomers(user: AuthUser | null): boolean {
  return isStaff(user);
}

/** DELETE /customers/:id — admin only */
export function canDeleteCustomer(user: AuthUser | null): boolean {
  return isAdmin(user);
}

/** /services — staff, admin */
export function canViewServices(user: AuthUser | null): boolean {
  return isStaff(user);
}

/** POST /auth/users, PATCH /auth/users/:id/role — admin only */
export function canManageUsers(user: AuthUser | null): boolean {
  return isAdmin(user);
}
