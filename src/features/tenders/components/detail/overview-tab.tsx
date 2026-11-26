import {
  Award01Icon,
  Calendar03Icon,
  Idea01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Meter } from "@/components/status/meter";
import type { TenderAnalysis } from "@/domain/analysis";
import { PageRefs } from "@/features/evidence/page-refs";
import { formatDate } from "@/lib/format";
import { EmptyLine, SectionCard } from "./section-card";

function parseWeight(weight: string | null): number | null {
  const match = weight?.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

export function OverviewTab({ analysis }: { analysis: TenderAnalysis }) {
  const { overview } = analysis;
  const facts: [string, string | null][] = [
    ["Issuer", overview.issuer],
    ["Reference", overview.referenceNumber],
    ["Procurement type", overview.procurementType],
    ["Sector", overview.sector],
    ["Estimated value", overview.estimatedValue],
    ["Contract duration", overview.contractDuration],
    ["Location", overview.location],
    ["Contact", overview.contact],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <SectionCard title="Bid considerations" icon={Idea01Icon} description="What a bid manager should weigh before committing.">
          <ul className="space-y-2">
            {analysis.assessment.keyConsiderations.map((item, index) => (
              <li key={index} className="flex gap-2.5 text-sm leading-relaxed">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Evaluation criteria" icon={Award01Icon}>
          {analysis.evaluationCriteria.length === 0 ? (
            <EmptyLine>The document does not state how bids will be evaluated.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {analysis.evaluationCriteria.map((criterion, index) => {
                const weight = parseWeight(criterion.weight);
                return (
                  <li key={index}>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span>{criterion.criterion}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {criterion.weight && <span className="font-medium tabular">{criterion.weight}</span>}
                        <PageRefs pages={criterion.pages} quote={criterion.criterion} />
                      </span>
                    </div>
                    {weight !== null && <Meter value={weight} tone="brand" label={`${criterion.criterion} weight`} className="mt-1.5" />}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="space-y-4">
        <SectionCard title="Key facts" icon={InformationCircleIcon}>
          <dl className="space-y-2.5 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className={value ? "break-words" : "text-muted-foreground italic"}>{value ?? "Not stated"}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Key dates" icon={Calendar03Icon}>
          {analysis.keyDates.length === 0 ? (
            <EmptyLine>No dates found in the document.</EmptyLine>
          ) : (
            <ol className="relative space-y-4 border-l pl-4">
              {analysis.keyDates.map((item, index) => (
                <li key={index} className="relative">
                  <span aria-hidden className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-card bg-primary" />
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="tabular">{item.date ? formatDate(item.date) : item.rawText}</span>
                    <PageRefs pages={item.pages} quote={item.rawText} />
                  </p>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
