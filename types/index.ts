import { UserRole, OrderStatus, PaymentStatus } from "@prisma/client";

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenue: number;
}

export interface PharmacyWithDistance {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  rating?: number;
  verified: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
  imageUrl?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}
