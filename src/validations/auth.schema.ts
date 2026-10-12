import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["FOOD_PROVIDER", "NGO", "DISTRIBUTOR", "ADMIN"]),
  // Organization / Role-specific fields
  organizationName: z.string().optional(),
  organizationType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  foodCapacity: z.number().positive().optional(),
  vehicleType: z.string().optional(),
});