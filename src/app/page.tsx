import { Alert02Icon, Calendar03Icon, CloudUploadIcon, Files01Icon, PieChart02Icon, Target02Icon, TaskDone01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { connection } from "next/server";
import { Donut } from "@/components/charts/donut";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Meter } from "@/components/status/meter";
import { EmptyState } from "@/components/status/states";
import { SEVERITY_META } from "@/components/status/tones";
import { Button } from "@/components/ui/button";
import { SEVERITIES } from "@/domain/analysis";
import { AttentionPanel } from "@/features/dashboard/components/attention-panel";
import { ComingUpPanel } from "@/features/dashboard/components/coming-up-panel";
import { ComplianceBreakdown } from "@/features/dashboard/components/compliance-breakdown";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { computePortfolioStats, summarizePortfolio } from "@/features/dashboard/stats";
import { SampleDocuments } from "@/features/tenders/components/sample-documents";
import { TendersTable } from "@/features/tenders/components/tenders-table";
import { getDashboardData, listKeyDates } from "@/features/tenders/server/queries";
import { describeDeadline } from "@/lib/format";

function UploadButton() {
  return (
    <Button asChild>
      <Link href="/tenders/new">
        <HugeiconsIcon icon={CloudUploadIcon} size={16} />
        Upload tender
      </Link>
    </Button>
  );
}

export default async function DashboardPage() {
  await connection();
  const now = new Date();
  const [{ tenders, attention }, keyDates] = await Promise.all([getDashboardData(), listKeyDates()]);
  const stats = computePortfolioStats(tenders, now);
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(now);
  const summary = (
    <span className="inline-flex items-start gap-1.5">
      <HugeiconsIcon icon={Target02Icon} size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
      {summarizePortfolio(stats)}
    </span>
  );

  if (tenders.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={today} title="Bid portfolio" description={summary} actions={<UploadButton />} />
        <EmptyState
          icon={Files01Icon}
          title="No tenders yet"
          description="Upload a tender or RFP in PDF format. The AI extracts requirements, deadlines and risks, and builds a compliance checklist."
          action={<UploadButton />}
        />
        <div className="max-w-2xl">
          <h2 className="mb-2 text-sm font-semibold">Or start with a sample tender</h2>
          <SampleDocuments />
        </div>
      </div>
    );
  }

  const next = stats.nextDeadline;
  const nextInfo = next ? describeDeadline(next.submissionDeadline, now) : null;
  const upcoming = keyDates.filter((event) => event.date.getTime() >= now.getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={today} title="Bid portfolio" description={summary} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open tenders"
          value={stats.open}
          hint={stats.analyzing > 0 ? `${stats.analyzing} being analyzed` : `${stats.total} in the workspace`}
          icon={Files01Icon}
          tone="brand"
          href="/tenders"
        />
        <KpiCard
          label="Next submission"
          value={nextInfo?.daysLeft !== null && nextInfo ? `${nextInfo.daysLeft}d` : "—"}
          hint={next ? next.title : "No upcoming deadlines"}
          icon={Calendar03Icon}
          tone={nextInfo && (nextInfo.daysLeft ?? 99) <= 7 ? "danger" : "warning"}
          href="/deadlines"
        />
        <KpiCard
          label="Compliance progress"
          value={`${stats.compliancePercent}%`}
          hint={`${stats.checklistCompleted} of ${stats.checklistTotal} checklist items`}
          icon={TaskDone01Icon}
          tone="success"
          href={next ? `/tenders/${next.id}?tab=checklist` : "/tenders"}
        >
          <Meter value={stats.compliancePercent} tone="success" label="Portfolio compliance progress" />
        </KpiCard>
        <KpiCard
          label="Critical risks"
          value={stats.risks.critical}
          hint={`${stats.risks.high} more rated high`}
          icon={Alert02Icon}
          tone="danger"
          href="/risks"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AttentionPanel items={attention.slice(0, 5)} total={stats.risks.critical + stats.risks.high} className="lg:col-span-2" />
        <ComingUpPanel events={upcoming} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ComplianceBreakdown tenders={tenders} className="lg:col-span-2" />
        <Panel title="Risk severity" subtitle="Findings across open tenders" icon={PieChart02Icon} tone="danger">
          <div className="px-5 pt-2 pb-5">
            <Donut
              centerLabel="findings"
              segments={SEVERITIES.map((severity) => ({
                label: SEVERITY_META[severity].label,
                value: stats.risks[severity],
                tone: SEVERITY_META[severity].tone,
              }))}
            />
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent tenders"
        subtitle="Latest uploads and their status"
        icon={Files01Icon}
        tone="neutral"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/tenders">View all</Link>
          </Button>
        }
      >
        <div className="border-t">
          <TendersTable tenders={tenders.slice(0, 5)} />
        </div>
      </Panel>
    </div>
  );
}
