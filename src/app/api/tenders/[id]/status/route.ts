import { NextResponse } from "next/server";
import { uuidParam } from "@/domain/api";
import { isAnalysisStale } from "@/features/tenders/server/analyze-tender";
import { getTenderStatus } from "@/features/tenders/server/queries";
import { route } from "@/server/http/route";

export const GET = route<{ id: string }>(async (_request, { params }) => {
  const id = uuidParam.parse((await params).id);
  const tender = await getTenderStatus(id);
  return NextResponse.json(
    {
      status: tender.status,
      errorMessage: tender.errorMessage,
      stale: isAnalysisStale(tender.status, tender.analysisStartedAt),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
