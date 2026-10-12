import { z } from "zod";

export const wasteReasonEnum = z.enum([
  "EXPIRED_BEFORE_PICKUP",
  "SPOILED_IN_STORAGE",
  "DAMAGED_IN_TRANSIT",
  "CONTAMINATED",
  "REJECTED_AT_PICKUP",
  "REJECTED_AT_DELIVERY",
  "QUANTITY_MISMATCH_DISCARD",
  "COLD_CHAIN_FAILURE",
  "OTHER",
]);

export const disposalMethodEnum = z.enum([
  "COMPOSTING",
  "ANIMAL_FEED",
  "BIO_ENERGY_ANAEROBIC",
  "COMMERCIAL_INCINERATION",
  "LANDFILL_DISPOSAL",
  "NOT_SPECIFIED",
]);

export const createWasteRecordSchema = z.object({
  foodName: z.string().min(2, "Food name is required"),
  foodCategory: z.string().min(2, "Food category is required"),
  quantityWasted: z.number().positive("Wasted quantity must be greater than 0"),
  unit: z.string().default("KG"),
  reason: wasteReasonEnum,
  disposalMethod: disposalMethodEnum.default("NOT_SPECIFIED"),
  stage: z.string().min(2, "Stage description is required"), // e.g. "PROVIDER_KITCHEN", "TRANSIT", "NGO_WAREHOUSE", "INSPECTION"
  notes: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  donationId: z.string().uuid("Invalid donation ID").optional().nullable(),
  deliveryId: z.string().uuid("Invalid delivery ID").optional().nullable(),
});

export type CreateWasteRecordInput = z.infer<typeof createWasteRecordSchema>;