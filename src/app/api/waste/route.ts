import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createWasteRecordSchema } from "@/validations/waste.schema";
import { createWasteRecord, getWasteRecords } from "@/services/waste.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = createWasteRecordSchema.parse(body);

    const record = await createWasteRecord(user, validated);

    return NextResponse.json({
      success: true,
      message: "Waste record logged successfully.",
      data: record,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = req.nextUrl.searchParams;

    const reason = searchParams.get("reason") || undefined;
    const disposalMethod = searchParams.get("disposalMethod") || undefined;
    const stage = searchParams.get("stage") || undefined;
    const search = searchParams.get("search") || undefined;
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;

    const records = await getWasteRecords(user, {
      reason,
      disposalMethod,
      stage,
      search,
      from: from && !isNaN(from.getTime()) ? from : undefined,
      to: to && !isNaN(to.getTime()) ? to : undefined,
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    return handleApiError(error);
  }
}