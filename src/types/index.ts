export type UserRole = "FOOD_PROVIDER" | "NGO" | "DISTRIBUTOR" | "ADMIN";
export type AccountStatus = "ACTIVE" | "PENDING" | "SUSPENDED";
export type VerificationStatus = "VERIFIED" | "PENDING" | "REJECTED";
export type AvailabilityStatus = "AVAILABLE" | "BUSY" | "INACTIVE" | "OFFLINE";
export type DonationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REQUESTED"
  | "MATCHED"
  | "ASSIGNED"
  | "PICKUP_IN_PROGRESS"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "EXPIRED";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "FULFILLED";
export type DeliveryStatus =
  | "ASSIGNED"
  | "PICKUP_IN_PROGRESS"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "URGENT" | "ACTION_REQUIRED";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  organizationId?: string;
  organizationName?: string;
  avatarUrl?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

export interface MatchScoreResult {
  ngoId: string;
  ngoName: string;
  matchScore: number;
  distanceKm: number;
  capacityMatchScore: number;
  urgencyScore: number;
  availabilityScore: number;
  calculationRationale: string;
}

export interface ImpactMetrics {
  totalFoodDonatedKg: number;
  totalFoodDeliveredKg: number;
  totalFoodSavedKg: number;
  completedDonationsCount: number;
  activeDeliveriesCount: number;
  ngosServedCount: number;
  providersActiveCount: number;
  mealsServed: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  financialValueSavedUsd: number;
}