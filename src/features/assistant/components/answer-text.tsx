"use client";

import type { Citation } from "@/domain/analysis";
import { useEvidence } from "@/features/evidence/evidence-context";
import { parseAnswer, type Inline } from "../answer-format";

function InlineContent({ parts, citations }: { parts: Inline[]; citations: Citation[] }) {
  const evidence = useEvidence();
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "bold") return <strong key={index}>{part.value}</strong>;
        if (part.type === "text") return <span key={index}>{part.value}</span>;
        const citation = citations[part.index - 1];
        if (!citation) return null;
        return (
          <button
            key={index}
            type="button"
            onClick={() => evidence?.openEvidence(citation.page, citation.quote)}
            className="mx-0.5 inline-flex h-4 items-center rounded bg-brand-soft px-1 align-text-top text-[10px] font-semibold text-primary outline-none hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Source ${part.index}: page ${citation.page}`}
          >
            p.{citation.page}
          </button>
        );
      })}
    </>
  );
}

export function AnswerText({ text, citations }: { text: string; citations: Citation[] }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {parseAnswer(text).map((block, index) =>
        block.type === "paragraph" ? (
          <p key={index}>
            <InlineContent parts={block.content} citations={citations} />
          </p>
        ) : (
          <ul key={index} className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <InlineContent parts={item} citations={citations} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
