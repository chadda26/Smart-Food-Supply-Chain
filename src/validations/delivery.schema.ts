import { z } from "zod";

export const assignDistributorSchema = z.object({
  donationId: z.string().uuid(),
  ngoId: z.string().uuid(),
  distributorId: z.string().uuid(),
  pickupEtaMinutes: z.number().optional().default(30),
});

export const pickupVerificationSchema = z.object({
  verificationCode: z.string().min(4, "4-digit verification code required"),
  packageCondition: z.enum(["GOOD", "FAIR", "DAMAGED"]),
  temperatureCheck: z.string().optional().nullable(),
  photoUrl: z.string().min(1, "Pickup verification photo is required as physical proof of quality"),
  notes: z.string().optional().nullable(),
});

export const deliveryVerificationSchema = z.object({
  receivedQuantity: z.number().positive("Received quantity must be greater than 0"),
  conditionStatus: z.enum(["EXCELLENT", "GOOD", "ACCEPTABLE", "DAMAGED", "REJECTED"]),
  status: z.enum(["DELIVERED", "CONFIRMED", "DISPUTED"]).default("CONFIRMED"),
  disputeReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const feedbackSchema = z.object({
  deliveryId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  foodQualityRating: z.number().int().min(1).max(5).optional(),
  handlingRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export const locationUpdateSchema = z.object({
  deliveryId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  accuracy: z.number().optional().nullable(),
});