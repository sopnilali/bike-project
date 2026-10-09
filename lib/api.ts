import axios, { AxiosError } from "axios";
import type {
  ApiEnvelope,
  AuthPayload,
  AuthUser,
  Bike,
  Customer,
  ServiceRecord,
  UserRole,
} from "./types";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://bike-server-api.vercel.app/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ---------- Auth token storage (localStorage + cookie for proxy) ----------
export const AUTH_TOKEN_KEY = "motocare_token";

function syncTokenCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(
      token
    )}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (raw) return raw;
  } catch {
    // ignore
  }
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${AUTH_TOKEN_KEY}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function setAuthToken(token: string) {
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore
  }
  syncTokenCookie(token);
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
  syncTokenCookie(null);
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ message?: string }>;
    const msg = e.response?.data?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (e.code === "ECONNABORTED") return "Request timed out. Please retry.";
    if (!e.response) return "Network error. Check your connection and retry.";
    return fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data;
}

// ---------- Customers ----------
export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await api.get<ApiEnvelope<Customer[]>>("/customers");
  return unwrap(data);
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const { data } = await api.get<ApiEnvelope<Customer>>(`/customers/${id}`);
  return unwrap(data);
}

export async function createCustomer(input: {
  name: string;
  email: string;
  phone: string;
}): Promise<Customer> {
  const { data } = await api.post<ApiEnvelope<Customer>>("/customers", input);
  return unwrap(data);
}

export async function updateCustomer(
  id: string,
  input: { name: string; email: string; phone: string }
): Promise<Customer> {
  const { data } = await api.put<ApiEnvelope<Customer>>(
    `/customers/${id}`,
    input
  );
  return unwrap(data);
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}

// ---------- Bikes ----------
export async function fetchBikes(): Promise<Bike[]> {
  const { data } = await api.get<ApiEnvelope<Bike[]>>("/bikes");
  return unwrap(data);
}

export async function fetchBike(id: string): Promise<Bike> {
  const { data } = await api.get<ApiEnvelope<Bike>>(`/bikes/${id}`);
  return unwrap(data);
}

export async function createBike(input: {
  brand: string;
  model: string;
  year: number;
  customerId: string;
}): Promise<Bike> {
  const { data } = await api.post<ApiEnvelope<Bike>>("/bikes", input);
  return unwrap(data);
}

// ---------- Services ----------
export async function fetchServices(): Promise<ServiceRecord[]> {
  const { data } = await api.get<ApiEnvelope<ServiceRecord[]>>("/services");
  return unwrap(data);
}

export async function fetchService(id: string): Promise<ServiceRecord> {
  const { data } = await api.get<ApiEnvelope<ServiceRecord>>(
    `/services/${id}`
  );
  return unwrap(data);
}

export async function createService(input: {
  bikeId: string;
  serviceDate: string;
  description: string;
  status: string;
}): Promise<ServiceRecord> {
  const { data } = await api.post<ApiEnvelope<ServiceRecord>>(
    "/services",
    input
  );
  return unwrap(data);
}

export async function completeService(id: string): Promise<ServiceRecord> {
  const { data } = await api.put<ApiEnvelope<ServiceRecord>>(
    `/services/${id}/complete`
  );
  return unwrap(data);
}

export async function fetchOverdueServices(): Promise<ServiceRecord[]> {
  const { data } = await api.get<ApiEnvelope<ServiceRecord[]>>(
    "/services/status"
  );
  return unwrap(data);
}

// ---------- Auth ----------
function normalizeUser(raw: unknown): AuthUser {
  const u = (raw ?? {}) as Record<string, unknown>;
  const id =
    (u.id as string) ??
    (u.userId as string) ??
    (u._id as string) ??
    (u.customerId as string) ??
    "";
  const rawRole = (u.role as string) ?? "";
  const role: UserRole =
    rawRole === "admin" || rawRole === "staff" || rawRole === "customer"
      ? rawRole
      : "customer";
  const photoRaw =
    (u.photoUrl as unknown) ??
    (u.photo as unknown) ??
    (u.avatar as unknown) ??
    (u.avatarUrl as unknown) ??
    (u.profilePhoto as unknown) ??
    (u.profilePhotoUrl as unknown) ??
    (u.image as unknown) ??
    (u.imageUrl as unknown) ??
    null;
  return {
    id: String(id ?? ""),
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    phone: String(u.phone ?? ""),
    role,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : undefined,
    photoUrl:
      typeof photoRaw === "string" && photoRaw.length > 0 ? photoRaw : null,
  };
}

function normalizeAuthPayload(raw: unknown): AuthPayload {
  const d = (raw ?? {}) as Record<string, unknown>;
  const token =
    (d.token as string) ??
    (d.accessToken as string) ??
    (d.jwt as string) ??
    (d.authToken as string) ??
    "";
  const userRaw =
    (d.user as unknown) ?? (d.profile as unknown) ?? (d.account as unknown);
  // Some APIs return a flat object: { id, name, email, ..., token }
  const user = normalizeUser(userRaw ?? d);
  if (!token) throw new Error("Auth response did not include a token.");
  return { user, token: String(token) };
}

export async function signup(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AuthPayload> {
  const { data } = await api.post<ApiEnvelope<unknown>>("/auth/signup", input);
  const payload = normalizeAuthPayload(data.data);
  setAuthToken(payload.token);
  return payload;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthPayload> {
  const { data } = await api.post<ApiEnvelope<unknown>>("/auth/login", input);
  const payload = normalizeAuthPayload(data.data);
  setAuthToken(payload.token);
  return payload;
}

export function logout() {
  clearAuthToken();
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<ApiEnvelope<unknown>>("/auth/me");
  return normalizeUser(data.data);
}

export async function updateMe(input: {
  name?: string;
  phone?: string;
}): Promise<AuthUser> {
  const { data } = await api.put<ApiEnvelope<unknown>>("/auth/me", input);
  return normalizeUser(data.data);
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.post("/auth/change-password", input);
}

export async function forgotPassword(
  email: string
): Promise<{ resetToken?: string; message: string }> {
  const { data } = await api.post<ApiEnvelope<unknown>>(
    "/auth/forgot-password",
    { email }
  );
  const raw = (data.data ?? {}) as Record<string, unknown>;
  const resetToken =
    typeof raw.resetToken === "string" ? raw.resetToken : undefined;
  return { resetToken, message: data.message };
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
}): Promise<void> {
  await api.post("/auth/reset-password", input);
}

// ---------- Admin: user + role management (admin only) ----------
export async function createUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}): Promise<AuthUser> {
  const { data } = await api.post<ApiEnvelope<unknown>>("/auth/users", input);
  return normalizeUser(data.data);
}

export async function updateUserRole(
  id: string,
  role: UserRole
): Promise<AuthUser> {
  const { data } = await api.patch<ApiEnvelope<unknown>>(
    `/auth/users/${encodeURIComponent(id)}/role`,
    { role }
  );
  return normalizeUser(data.data);
}

// ---------- Profile photo ----------
// Backend endpoints (Express + multer style):
//   PUT    /auth/me/photo          multipart/form-data, file field "photo"
//   DELETE /auth/me/photo
//   GET    /files/profile/:id      serves the stored image
export const PROFILE_PHOTO_FIELD = "photo";
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function getProfilePhotoUrl(id: string): string {
  return `${baseURL}/files/profile/${encodeURIComponent(id)}`;
}

function looksLikeUser(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const u = raw as Record<string, unknown>;
  return (
    typeof u.email === "string" ||
    typeof u.name === "string" ||
    typeof u.phone === "string"
  );
}

export async function uploadProfilePhoto(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.append(PROFILE_PHOTO_FIELD, file, file.name);
  // NOTE: fetch (not the axios instance) is used on purpose — the instance
  // defaults to `Content-Type: application/json`, and setting multipart
  // manually would drop the boundary. fetch sets it automatically.
  const token = getAuthToken();
  const res = await fetch(`${baseURL}/auth/me/photo`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json = (await res.json().catch(() => null)) as {
    message?: string;
    data?: unknown;
  } | null;
  if (!res.ok) {
    throw new Error(
      typeof json?.message === "string" && json.message.length > 0
        ? json.message
        : "Photo upload failed."
    );
  }
  if (json && looksLikeUser(json.data)) return normalizeUser(json.data);
  return fetchMe();
}

export async function deleteProfilePhoto(): Promise<AuthUser> {
  await api.delete("/auth/me/photo");
  return fetchMe();
}

export async function fetchProfilePhotoBlob(id: string): Promise<Blob> {
  const res = await api.get<Blob>(`/files/profile/${encodeURIComponent(id)}`, {
    responseType: "blob",
  });
  return res.data;
}

export { baseURL };
