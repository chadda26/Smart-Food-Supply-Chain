import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/validations/auth.schema";
import { registerUser } from "@/services/auth.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const user = await registerUser(validated, ip);

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please log in to continue.",
        data: { id: user.id, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}