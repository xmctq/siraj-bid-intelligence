import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiErrorBody } from "@/domain/api";
import { AiError } from "@/server/ai/llm";
import { AppError } from "@/server/errors";

export function errorResponse(code: string, message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status, headers });
}

/** Maps thrown errors to safe JSON responses; internals are logged, never returned. */
export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    const headers = error.status === 429 ? { "Retry-After": "60" } : undefined;
    return errorResponse(error.code, error.message, error.status, headers);
  }
  if (error instanceof AiError) {
    console.error("[api] AI error", error.code, error.message);
    return errorResponse(`ai_${error.code}`, error.userMessage, error.code === "rate_limited" ? 429 : 503);
  }
  if (error instanceof z.ZodError) {
    return errorResponse("invalid_request", error.issues[0]?.message ?? "Invalid request.", 400);
  }
  console.error("[api] unhandled error", error);
  return errorResponse("internal_error", "Something went wrong. Please try again.", 500);
}

type Handler<P> = (request: Request, ctx: { params: Promise<P> }) => Promise<Response>;

export function route<P = Record<string, never>>(handler: Handler<P>): Handler<P> {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("invalid_json", "Request body must be valid JSON.");
  }
  return schema.parse(body);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
