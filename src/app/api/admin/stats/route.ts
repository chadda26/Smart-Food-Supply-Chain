import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getComprehensiveAdminAnalytics, DateRangeFilter } from "@/services/analytics.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const searchParams = req.nextUrl.searchParams;
    const range = (searchParams.get("range") || "all") as DateRangeFilter;
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;

    const report = await getComprehensiveAdminAnalytics({
      range,
      from: from && !isNaN(from.getTime()) ? from : undefined,
      to: to && !isNaN(to.getTime()) ? to : undefined,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return handleApiError(error);
  }
}