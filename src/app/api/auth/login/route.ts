import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/validations/auth.schema";
import { loginUser } from "@/services/auth.service";
import { setSessionCookie } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ua = req.headers.get("user-agent") || undefined;

    const { user, token } = await loginUser(validated, ip, ua);
    setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: { user },
    });
  } catch (error) {
    return handleApiError(error);
  }
}