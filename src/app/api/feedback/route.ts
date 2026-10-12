import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { feedbackSchema } from "@/validations/delivery.schema";
import { db } from "@/lib/db";
import { handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = feedbackSchema.parse(body);

    const delivery = await db.delivery.findUnique({
      where: { id: validated.deliveryId },
      include: { ngo: true, distributor: true },
    });

    if (!delivery) throw new NotFoundError("Delivery not found");
    if (delivery.ngo.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenError("Only the recipient NGO can submit feedback for this delivery.");
    }

    const feedback = await db.feedback.upsert({
      where: { deliveryId: validated.deliveryId },
      create: {
        deliveryId: validated.deliveryId,
        ngoId: delivery.ngoId,
        distributorId: delivery.distributorId,
        rating: validated.rating,
        punctualityRating: validated.punctualityRating,
        foodQualityRating: validated.foodQualityRating,
        handlingRating: validated.handlingRating,
        comment: validated.comment,
      },
      update: {
        rating: validated.rating,
        punctualityRating: validated.punctualityRating,
        foodQualityRating: validated.foodQualityRating,
        handlingRating: validated.handlingRating,
        comment: validated.comment,
      },
    });

    // Recompute distributor reliability score (moving average)
    const allFeedbacks = await db.feedback.findMany({
      where: { distributorId: delivery.distributorId },
      select: { rating: true },
    });

    const avgRating =
      allFeedbacks.reduce((acc, curr) => acc + curr.rating, 0) / Math.max(allFeedbacks.length, 1);

    await db.distributor.update({
      where: { id: delivery.distributorId },
      data: { reliabilityScore: Math.round(avgRating * 10) / 10 },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully.",
      data: feedback,
    });
  } catch (error) {
    return handleApiError(error);
  }
}