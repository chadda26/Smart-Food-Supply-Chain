import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, ValidationError } from "@/lib/errors";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, data: null }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: { user } });
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = await req.json();

    if (body.avatarUrl !== undefined && typeof body.avatarUrl !== "string" && body.avatarUrl !== null) {
      throw new ValidationError("Invalid avatar URL format");
    }

    const updatedUser = await db.user.update({
      where: { id: sessionUser.id },
      data: {
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ success: true, data: { user: updatedUser } });
  } catch (error) {
    return handleApiError(error);
  }
}