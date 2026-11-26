import { after, NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES, tenderListQuerySchema } from "@/domain/api";
import { runTenderAnalysis } from "@/features/tenders/server/analyze-tender";
import { listTenders } from "@/features/tenders/server/queries";
import { createTenderFromUpload } from "@/features/tenders/server/upload-tender";
import { AppError } from "@/server/errors";
import { enforceAiRateLimit } from "@/server/http/rate-limit";
import { clientIp, route } from "@/server/http/route";

// Analysis continues after the response via after(); give it the Hobby plan's full budget.
export const maxDuration = 300;

export const GET = route(async (request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = tenderListQuerySchema.parse(params);
  return NextResponse.json(await listTenders(query));
});

export const POST = route(async (request) => {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    throw new AppError("file_too_large", "PDFs must be 4 MB or smaller.", 413);
  }
  await enforceAiRateLimit("upload", clientIp(request));

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    throw new AppError("invalid_request", "Upload must be multipart/form-data with a 'file' field.");
  }
  if (!(file instanceof File)) {
    throw new AppError("missing_file", "Choose a PDF file to upload.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new AppError("file_too_large", "PDFs must be 4 MB or smaller.", 413);
  }

  const result = await createTenderFromUpload({
    fileName: file.name,
    bytes: new Uint8Array(await file.arrayBuffer()),
  });
  if (!result.duplicate) {
    after(() => runTenderAnalysis(result.id));
  }
  return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
});
