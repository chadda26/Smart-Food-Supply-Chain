import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTransitReportData, generateTransitReportPdf } from "@/services/report.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const reportData = await getTransitReportData(user, params.id);
    const pdfBuffer = await generateTransitReportPdf(reportData);

    const filename = `Transit-Report-${reportData.delivery.donation.humanReadableId}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}