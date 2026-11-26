import { CheckListIcon, PackageIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import type { TenderAnalysis } from "@/domain/analysis";
import { PageRefs } from "@/features/evidence/page-refs";
import { EmptyLine, MandatoryPill, SectionCard } from "./section-card";

function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return [...groups.entries()];
}

export function RequirementsTab({ analysis }: { analysis: TenderAnalysis }) {
  const technicalGroups = groupBy(analysis.technicalRequirements, (r) => r.category || "General");
  const mandatoryEligibility = analysis.eligibilityCriteria.filter((c) => c.mandatory).length;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionCard
        title="Eligibility criteria"
        icon={CheckListIcon}
        description={`${analysis.eligibilityCriteria.length} criteria · ${mandatoryEligibility} mandatory`}
        bodyClassName="p-0"
      >
        {analysis.eligibilityCriteria.length === 0 ? (
          <div className="p-4">
            <EmptyLine>No eligibility criteria were stated.</EmptyLine>
          </div>
        ) : (
          <ul className="divide-y">
            {analysis.eligibilityCriteria.map((criterion, index) => (
              <li key={index} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-sm leading-relaxed">{criterion.criterion}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <MandatoryPill mandatory={criterion.mandatory} />
                  <PageRefs pages={criterion.pages} quote={criterion.criterion} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Deliverables"
        icon={PackageIcon}
        description={`${analysis.deliverables.length} deliverables`}
        bodyClassName="p-0"
      >
        {analysis.deliverables.length === 0 ? (
          <div className="p-4">
            <EmptyLine>No deliverables were listed.</EmptyLine>
          </div>
        ) : (
          <ul className="divide-y">
            {analysis.deliverables.map((deliverable, index) => (
              <li key={index} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{deliverable.title}</p>
                  <PageRefs pages={deliverable.pages} quote={deliverable.title} />
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{deliverable.description}</p>
                {deliverable.timeline && <p className="mt-1 text-xs font-medium text-primary">Due: {deliverable.timeline}</p>}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Technical requirements"
        icon={Settings02Icon}
        description={`${analysis.technicalRequirements.length} requirements across ${technicalGroups.length} areas`}
        className="xl:col-span-2"
        bodyClassName="p-0"
      >
        {technicalGroups.length === 0 ? (
          <div className="p-4">
            <EmptyLine>No technical requirements were stated.</EmptyLine>
          </div>
        ) : (
          technicalGroups.map(([category, requirements]) => (
            <div key={category} className="border-b last:border-b-0">
              <h4 className="bg-muted/50 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {category}
              </h4>
              <ul className="divide-y">
                {requirements.map((requirement, index) => (
                  <li key={index} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div>
                      <p className="text-sm font-medium">{requirement.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{requirement.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MandatoryPill mandatory={requirement.mandatory} />
                      <PageRefs pages={requirement.pages} quote={requirement.description} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}
