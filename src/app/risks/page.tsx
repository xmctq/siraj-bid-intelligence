import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";
import { RiskWorkspace } from "@/features/risks/components/risk-workspace";
import { listAllRisks } from "@/features/tenders/server/queries";

export const metadata: Metadata = { title: "Risk register" };

export default async function RisksPage({ searchParams }: PageProps<"/risks">) {
  await connection();
  const [{ risk }, risks] = await Promise.all([searchParams, listAllRisks()]);
  const critical = risks.filter((r) => r.severity === "critical").length;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor / Risk register"
        title="Risk register"
        description={`${risks.length} AI findings across all tenders · ${critical} critical. Select one to see the recommended action and its source.`}
      />
      <RiskWorkspace risks={risks} initialRiskId={typeof risk === "string" ? risk : undefined} />
    </div>
  );
}
