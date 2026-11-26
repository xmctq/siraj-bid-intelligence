import { NextResponse } from "next/server";
import { askQuestionSchema, uuidParam } from "@/domain/api";
import { askQuestion, getChatHistory } from "@/features/assistant/server/ask-question";
import { enforceAiRateLimit } from "@/server/http/rate-limit";
import { clientIp, parseJson, route } from "@/server/http/route";

export const maxDuration = 120;

export const GET = route<{ id: string }>(async (_request, { params }) => {
  const id = uuidParam.parse((await params).id);
  return NextResponse.json({ messages: await getChatHistory(id) });
});

export const POST = route<{ id: string }>(async (request, { params }) => {
  const id = uuidParam.parse((await params).id);
  const { question } = await parseJson(request, askQuestionSchema);
  await enforceAiRateLimit("chat", clientIp(request));
  const message = await askQuestion(id, question);
  return NextResponse.json({ message }, { status: 201 });
});
