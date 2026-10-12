import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeToKg } from "@/services/analytics.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const donations = await db.foodDonation.findMany({
      include: {
        provider: true,
        delivery: {
          include: {
            distributor: { include: { user: true } },
            ngo: true,
            deliveryVerification: true,
            feedback: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Batch ID",
      "Food Name",
      "Category",
      "Quantity",
      "Unit",
      "Weight (KG)",
      "Status",
      "Donor Organization",
      "Donor City",
      "Assigned NGO",
      "Assigned Driver",
      "Driver Rating",
      "Preparation Time",
      "Expiry Time",
      "Created At",
      "Completed At",
      "Meals Provided",
      "CO2e Saved (KG)",
    ];

    const rows = donations.map((d) => {
      const weightKg = normalizeToKg(d.quantity, d.unit);
      const isCompleted = d.status === "COMPLETED" || d.status === "DELIVERED";
      const meals = isCompleted ? Math.round(weightKg * 2.4) : 0;
      const co2 = isCompleted ? Math.round(weightKg * 2.5 * 10) / 10 : 0;

      return [
        `"${d.humanReadableId}"`,
        `"${(d.foodName || "").replace(/"/g, '""')}"`,
        `"${d.foodCategory}"`,
        d.quantity,
        `"${d.unit}"`,
        weightKg,
        `"${d.status}"`,
        `"${(d.provider?.organizationName || "").replace(/"/g, '""')}"`,
        `"${d.provider?.city || ""}"`,
        `"${(d.delivery?.ngo?.organizationName || "Unassigned").replace(/"/g, '""')}"`,
        `"${(d.delivery?.distributor?.user?.name || "Unassigned").replace(/"/g, '""')}"`,
        d.delivery?.feedback?.rating || "N/A",
        d.preparationTime ? `"${d.preparationTime.toISOString()}"` : '""',
        d.expiryTime ? `"${d.expiryTime.toISOString()}"` : '""',
        `"${d.createdAt.toISOString()}"`,
        d.delivery?.completedAt ? `"${d.delivery.completedAt.toISOString()}"` : '""',
        meals,
        co2,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="SmartFoodChain-Platform-Summary-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}