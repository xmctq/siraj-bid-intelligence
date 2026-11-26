import { z } from "zod";

/** Request schemas shared by route handlers (validation) and client code (types). */

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_PAGES = 150;
export const MAX_QUESTION_LENGTH = 1000;

export const uuidParam = z.string().uuid();

export const checklistUpdateSchema = z.object({
  completed: z.boolean(),
});

export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Ask a slightly longer question.")
    .max(MAX_QUESTION_LENGTH, `Questions are limited to ${MAX_QUESTION_LENGTH} characters.`),
});

export const TENDER_STATUSES = ["processing", "ready", "failed"] as const;
export type TenderStatus = (typeof TENDER_STATUSES)[number];

export const tenderListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(TENDER_STATUSES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
});

export type ApiErrorBody = { error: { code: string; message: string } };
