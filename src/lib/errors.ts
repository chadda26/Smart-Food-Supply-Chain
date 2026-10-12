import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden. Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Requested resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict with existing state or data") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input parameter") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input parameters",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Generic internal server error (never leak raw database or stack information)
  const isDev = process.env.NODE_ENV === "development";
  const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred";

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: isDev ? errorMessage : "An unexpected error occurred. Please try again later.",
      },
    },
    { status: 500 }
  );
}