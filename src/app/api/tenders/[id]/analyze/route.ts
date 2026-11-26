import { after, NextResponse } from "next/server";
import { uuidParam } from "@/domain/api";
import { claimTenderForAnalysis, runTenderAnalysis } from "@/features/tenders/server/analyze-tender";
import { enforceAiRateLimit } from "@/server/http/rate-limit";
import { clientIp, route } from "@/server/http/route";

export const maxDuration = 300;

export const POST = route<{ id: string }>(async (request, { params }) => {
  const id = uuidParam.parse((await params).id);
  await enforceAiRateLimit("analyze", clientIp(request));
  await claimTenderForAnalysis(id);
  after(() => runTenderAnalysis(id));
  return NextResponse.json({ id, status: "processing" }, { status: 202 });
});
