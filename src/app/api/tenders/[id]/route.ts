import { NextResponse } from "next/server";
import { uuidParam } from "@/domain/api";
import { deleteTender } from "@/features/tenders/server/delete-tender";
import { getTenderDetail } from "@/features/tenders/server/queries";
import { enforceRateLimit, RATE_LIMITS } from "@/server/http/rate-limit";
import { clientIp, route } from "@/server/http/route";

type Params = { id: string };

export const GET = route<Params>(async (_request, { params }) => {
  const id = uuidParam.parse((await params).id);
  return NextResponse.json(await getTenderDetail(id));
});

export const DELETE = route<Params>(async (request, { params }) => {
  const id = uuidParam.parse((await params).id);
  await enforceRateLimit(`delete:${clientIp(request)}`, RATE_LIMITS.upload);
  await deleteTender(id);
  return new NextResponse(null, { status: 204 });
});
