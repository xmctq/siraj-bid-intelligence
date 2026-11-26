import { NextResponse } from "next/server";
import { z } from "zod";
import { uuidParam } from "@/domain/api";
import { getTenderPage } from "@/features/tenders/server/queries";
import { route } from "@/server/http/route";

const pageParam = z.coerce.number().int().min(1).max(10_000);

export const GET = route<{ id: string; page: string }>(async (_request, { params }) => {
  const raw = await params;
  const page = await getTenderPage(uuidParam.parse(raw.id), pageParam.parse(raw.page));
  return NextResponse.json(page, { headers: { "Cache-Control": "private, max-age=3600" } });
});
