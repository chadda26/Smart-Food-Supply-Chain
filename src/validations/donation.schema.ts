import { z } from "zod";

export const createDonationSchema = z.object({
  foodName: z.string().min(2, "Food name is required"),
  foodCategory: z.enum([
    "COOKED_MEALS",
    "RAW_INGREDIENTS",
    "PACKAGED_FOOD",
    "BAKERY",
    "PRODUCE",
    "DAIRY",
    "BEVERAGES",
  ]),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.enum(["KG", "PORTIONS", "LITERS", "BOXES"]),
  preparationTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid preparation timestamp",
  }),
  expiryTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid expiry timestamp",
  }),
  dietaryFlags: z.string().optional().nullable(),
  storageRequirements: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isDraft: z.boolean().optional().default(false),
}).refine(
  (data) => new Date(data.expiryTime) > new Date(data.preparationTime),
  {
    message: "Expiry time must be later than preparation time",
    path: ["expiryTime"],
  }
);

export const approveDonationSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});