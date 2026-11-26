import { NextResponse } from "next/server";
import { checklistUpdateSchema, uuidParam } from "@/domain/api";
import { setChecklistItemCompleted } from "@/features/checklist/server/update-checklist-item";
import { enforceRateLimit, RATE_LIMITS } from "@/server/http/rate-limit";
import { clientIp, parseJson, route } from "@/server/http/route";

export const PATCH = route<{ id: string; itemId: string }>(async (request, { params }) => {
  const raw = await params;
  const tenderId = uuidParam.parse(raw.id);
  const itemId = uuidParam.parse(raw.itemId);
  const { completed } = await parseJson(request, checklistUpdateSchema);
  await enforceRateLimit(`checklist:${clientIp(request)}`, RATE_LIMITS.checklist);
  return NextResponse.json(await setChecklistItemCompleted(tenderId, itemId, completed));
});
