import axios, { AxiosError } from "axios";
import type {
  ApiEnvelope,
  Bike,
  Customer,
  ServiceRecord,
} from "./types";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://bike-server-api.vercel.app/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
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

export { baseURL };
