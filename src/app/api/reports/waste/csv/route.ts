import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getWasteRecords } from "@/services/waste.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN");
    const records = await getWasteRecords(user);

    const headers = [
      "Waste ID",
      "Food Name",
      "Category",
      "Quantity Wasted",
      "Unit",
      "Reason",
      "Disposal Method",
      "Stage",
      "Recorded By Role",
      "Donor Organization",
      "Associated Delivery ID",
      "Notes",
      "Photo Attached",
      "Recorded At",
    ];

    const rows = records.map((r) => {
      return [
        `"${r.humanReadableId}"`,
        `"${(r.foodName || "").replace(/"/g, '""')}"`,
        `"${r.foodCategory}"`,
        r.quantityWasted,
        `"${r.unit}"`,
        `"${r.reason}"`,
        `"${r.disposalMethod}"`,
        `"${r.stage}"`,
        `"${r.recordedRole}"`,
        `"${(r.donation?.provider?.organizationName || "N/A").replace(/"/g, '""')}"`,
        `"${r.deliveryId || "N/A"}"`,
        `"${(r.notes || "").replace(/"/g, '""')}"`,
        r.photoUrl ? "YES" : "NO",
        `"${r.recordedAt.toISOString()}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="SmartFoodChain-Waste-Ledger-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}