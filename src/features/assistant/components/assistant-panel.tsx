"use client";

import { AiBrain01Icon, HelpCircleIcon, QuoteUpIcon, SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ErrorState } from "@/components/status/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Citation } from "@/domain/analysis";
import { MAX_QUESTION_LENGTH } from "@/domain/api";
import { useEvidence } from "@/features/evidence/evidence-context";
import { apiFetch, jsonInit } from "@/lib/api-client";
import { AnswerText } from "./answer-text";

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  answerable: boolean;
};

function Sources({ citations }: { citations: Citation[] }) {
  const evidence = useEvidence();
  if (citations.length === 0) return null;
  return (
    <div className="mt-3 border-t pt-3">
      <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Sources</p>
      <ol className="space-y-1.5">
        {citations.map((citation, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => evidence?.openEvidence(citation.page, citation.quote)}
              className="group flex w-full items-start gap-2 rounded-md p-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="mt-px inline-flex h-5 shrink-0 items-center rounded bg-brand-soft px-1.5 text-[11px] font-semibold text-primary tabular">
                [{index + 1}] p.{citation.page}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground italic group-hover:text-foreground">
                “{citation.quote}”
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AssistantBubble({ message }: { message: ChatMessageView }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-primary">
        <HugeiconsIcon icon={AiBrain01Icon} size={16} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border bg-card px-4 py-3">
        {!message.answerable && (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">
            <HugeiconsIcon icon={HelpCircleIcon} size={12} aria-hidden />
            Not covered by the document
          </p>
        )}
        <AnswerText text={message.content} citations={message.citations} />
        <Sources citations={message.citations} />
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
        {content}
      </p>
    </div>
  );
}

export function AssistantPanel({
  tenderId,
  suggestedQuestions,
  initialMessages,
}: {
  tenderId: string;
  suggestedQuestions: string[];
  initialMessages: ChatMessageView[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [error, setError] = useState<{ question: string; message: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pendingQuestion, error]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 3 || pendingQuestion) return;
    setError(null);
    setPendingQuestion(trimmed);
    setInput("");
    try {
      const { message } = await apiFetch<{ message: ChatMessageView }>(`/api/tenders/${tenderId}/chat`, jsonInit("POST", { question: trimmed }));
      setMessages((all) => [...all, { id: `${message.id}-q`, role: "user", content: trimmed, citations: [], answerable: true }, message]);
    } catch (askError) {
      setError({ question: trimmed, message: (askError as Error).message });
      setInput(trimmed);
    } finally {
      setPendingQuestion(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(input);
    }
  }

  const empty = messages.length === 0 && !pendingQuestion;

  return (
    <section aria-label="Tender assistant" className="flex flex-col rounded-xl border bg-card">
      <div className="max-h-[65vh] min-h-80 flex-1 space-y-5 overflow-y-auto bg-muted/30 p-4 sm:p-5" aria-live="polite">
        {empty && (
          <div className="mx-auto max-w-xl py-6 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft text-primary">
              <HugeiconsIcon icon={QuoteUpIcon} size={20} aria-hidden />
            </span>
            <h3 className="mt-3 text-sm font-semibold">Ask anything about this tender</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Answers come only from the document, and every claim links to the page it came from.
            </p>
            {suggestedQuestions.length > 0 && (
              <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => ask(question)}
                    className="rounded-lg border bg-card px-3 py-2.5 text-xs leading-relaxed outline-none hover:border-primary/40 hover:bg-brand-soft/40 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((message) =>
          message.role === "user" ? <UserBubble key={message.id} content={message.content} /> : <AssistantBubble key={message.id} message={message} />,
        )}
        {pendingQuestion && (
          <>
            <UserBubble content={pendingQuestion} />
            <div className="flex gap-3" aria-label="Assistant is answering">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-primary">
                <HugeiconsIcon icon={AiBrain01Icon} size={16} aria-hidden />
              </span>
              <div className="flex-1 space-y-2 rounded-xl border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Reading the relevant pages…</p>
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          </>
        )}
        {error && (
          <ErrorState
            title="The assistant couldn't answer"
            description={error.message}
            action={
              <Button size="sm" variant="outline" onClick={() => ask(error.question)}>
                Try again
              </Button>
            }
          />
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3">
        <label htmlFor="assistant-question" className="sr-only">
          Your question
        </label>
        <Textarea
          id="assistant-question"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. What guarantees are required, and when?"
          maxLength={MAX_QUESTION_LENGTH}
          rows={1}
          className="max-h-40 min-h-10 resize-none"
          disabled={pendingQuestion !== null}
        />
        <Button type="submit" size="icon" className="size-10 shrink-0" disabled={input.trim().length < 3 || pendingQuestion !== null} aria-label="Send question">
          <HugeiconsIcon icon={SentIcon} size={18} />
        </Button>
      </form>
    </section>
  );
}
