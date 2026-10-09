export type ServiceStatus = "pending" | "in-progress" | "done";

export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Bike {
  bikeId: string;
  brand: string;
  model: string;
  year: number;
  customerId: string;
  customer?: Customer;
}

export interface ServiceRecord {
  serviceId: string;
  bikeId: string;
  serviceDate: string;
  completionDate: string | null;
  description: string;
  status: ServiceStatus;
  bike?: Bike & { customer?: Customer };
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  status?: number;
  message: string;
  stack?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  photoUrl?: string | null;
}

export interface AuthPayload {
  user: AuthUser;
  token: string;
}
