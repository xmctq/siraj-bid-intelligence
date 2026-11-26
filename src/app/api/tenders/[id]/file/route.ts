import { eq } from "drizzle-orm";
import { uuidParam } from "@/domain/api";
import { getDb } from "@/server/db/client";
import { tenderFiles, tenders } from "@/server/db/schema";
import { notFound } from "@/server/errors";
import { route } from "@/server/http/route";

export const GET = route<{ id: string }>(async (_request, { params }) => {
  const id = uuidParam.parse((await params).id);
  const db = await getDb();
  const [file] = await db
    .select({ data: tenderFiles.data, fileName: tenders.fileName })
    .from(tenderFiles)
    .innerJoin(tenders, eq(tenders.id, tenderFiles.tenderId))
    .where(eq(tenderFiles.tenderId, id))
    .limit(1);
  if (!file) throw notFound("Document");

  const asciiName = file.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.data.byteLength),
      "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      // Content is immutable for a given id (re-uploads create a new tender).
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
});
