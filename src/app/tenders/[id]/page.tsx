import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorState } from "@/components/status/states";
import { SEVERITIES, type Severity } from "@/domain/analysis";
import { uuidParam } from "@/domain/api";
import { AssistantPanel } from "@/features/assistant/components/assistant-panel";
import { getChatHistory } from "@/features/assistant/server/ask-question";
import { ChecklistPanel } from "@/features/checklist/components/checklist-panel";
import { EvidenceProvider } from "@/features/evidence/evidence-context";
import { RiskRegister } from "@/features/risks/components/risk-register";
import { AnalysisProgress } from "@/features/tenders/components/detail/analysis-progress";
import { OverviewTab } from "@/features/tenders/components/detail/overview-tab";
import { RequirementsTab } from "@/features/tenders/components/detail/requirements-tab";
import { RetryAnalysisButton } from "@/features/tenders/components/detail/retry-analysis-button";
import { TenderActions } from "@/features/tenders/components/detail/tender-actions";
import { CriticalBanner, TenderHero } from "@/features/tenders/components/detail/tender-hero";
import { isTenderTab } from "@/features/tenders/components/detail/tabs-config";
import { TenderTabs } from "@/features/tenders/components/detail/tender-tabs";
import { getTenderDetail } from "@/features/tenders/server/queries";
import { AppError } from "@/server/errors";

async function loadTender(rawId: string) {
  const id = uuidParam.safeParse(rawId);
  if (!id.success) notFound();
  try {
    return await getTenderDetail(id.data);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/tenders/[id]">): Promise<Metadata> {
  const { tender } = await loadTender((await params).id);
  return { title: tender.title };
}

export default async function TenderPage({ params, searchParams }: PageProps<"/tenders/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const { tender, checklist, risks } = await loadTender(id);
  const analysis = tender.status === "ready" ? tender.analysis : null;
  const history = analysis ? await getChatHistory(tender.id) : [];
  const initialTab = isTenderTab(tab) ? tab : "overview";

  const riskCounts = Object.fromEntries(SEVERITIES.map((s) => [s, risks.filter((r) => r.severity === s).length])) as Record<
    Severity,
    number
  >;
  const progress = {
    total: checklist.length,
    completed: checklist.filter((i) => i.completed).length,
    mandatoryTotal: checklist.filter((i) => i.mandatory).length,
    mandatoryCompleted: checklist.filter((i) => i.mandatory && i.completed).length,
  };
  const critical = risks.filter((r) => r.severity === "critical");

  return (
    <EvidenceProvider tenderId={tender.id} pageCount={tender.pageCount}>
      <div className="space-y-5">
        <Link
          href="/tenders"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:underline"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          All tenders
        </Link>

        <TenderHero
          tender={tender}
          analysis={analysis}
          checklist={progress}
          riskCounts={riskCounts}
          actions={<TenderActions tenderId={tender.id} isSample={tender.isSample} canReanalyze={tender.status !== "processing"} />}
        />

        {tender.status === "processing" && (
          <AnalysisProgress tenderId={tender.id} pageCount={tender.pageCount} startedAt={tender.analysisStartedAt?.toISOString() ?? null} />
        )}

        {tender.status === "failed" && (
          <ErrorState
            title="Analysis failed"
            description={tender.errorMessage ?? "The analysis could not be completed."}
            action={<RetryAnalysisButton tenderId={tender.id} />}
          />
        )}

        {analysis && (
          <>
            <CriticalBanner tenderId={tender.id} count={critical.length} example={critical[0]?.title ?? ""} />
            <TenderTabs
              key={initialTab}
              initialTab={initialTab}
              tabs={[
                { value: "overview", label: "Overview", content: <OverviewTab analysis={analysis} /> },
                {
                  value: "requirements",
                  label: "Requirements",
                  count: analysis.eligibilityCriteria.length + analysis.technicalRequirements.length + analysis.deliverables.length,
                  content: <RequirementsTab analysis={analysis} />,
                },
                {
                  value: "checklist",
                  label: "Compliance checklist",
                  count: checklist.length,
                  content: <ChecklistPanel key={tender.analyzedAt?.toISOString()} tenderId={tender.id} initialItems={checklist} />,
                },
                { value: "risks", label: "Risks", count: risks.length, content: <RiskRegister risks={risks} /> },
                {
                  value: "assistant",
                  label: "AI assistant",
                  content: <AssistantPanel tenderId={tender.id} suggestedQuestions={analysis.suggestedQuestions} initialMessages={history} />,
                },
              ]}
            />
          </>
        )}
      </div>
    </EvidenceProvider>
  );
}
