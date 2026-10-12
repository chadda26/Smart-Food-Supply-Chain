import { z } from "zod";

export const createRequestSchema = z.object({
  donationId: z.string().uuid("Invalid donation ID"),
  requestedQuantity: z.number().positive("Requested quantity must be greater than 0"),
  requestReason: z.string().min(5, "Please describe the intended distribution reason"),
});