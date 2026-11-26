import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { DeadlineBadge, StatusBadge } from "@/components/status/badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { TenderSummary } from "../types";
import { ComplianceCell } from "./compliance-cell";
import { RiskCountsInline } from "./risk-counts";

function TenderName({ tender }: { tender: TenderSummary }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/tenders/${tender.id}`}
        className="block truncate font-medium outline-none hover:text-primary focus-visible:underline"
      >
        {tender.title}
      </Link>
      <p className="truncate text-xs text-muted-foreground">
        {[tender.issuer, tender.referenceNumber].filter(Boolean).join(" · ") || "Awaiting analysis"}
        {tender.isSample && " · Sample"}
      </p>
    </div>
  );
}

export function TendersTable({ tenders }: { tenders: TenderSummary[] }) {
  return (
    <>
      {/* Cards on small screens */}
      <ul className="divide-y md:hidden">
        {tenders.map((tender) => (
          <li key={tender.id} className="space-y-2.5 p-4">
            <div className="flex items-start justify-between gap-3">
              <TenderName tender={tender} />
              <StatusBadge status={tender.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <DeadlineBadge deadline={tender.submissionDeadline} />
              <RiskCountsInline risks={tender.risks} />
            </div>
            <ComplianceCell progress={tender.checklist} />
          </li>
        ))}
      </ul>

      {/* Table on larger screens */}
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Tender</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submission deadline</TableHead>
            <TableHead>Compliance</TableHead>
            <TableHead>Risks</TableHead>
            <TableHead className="w-10 pr-4">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender) => (
            <TableRow key={tender.id}>
              <TableCell className="max-w-80 py-3 pl-4">
                <TenderName tender={tender} />
              </TableCell>
              <TableCell>
                <StatusBadge status={tender.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs tabular">{formatDate(tender.submissionDeadline)}</span>
                  {tender.submissionDeadline && <DeadlineBadge deadline={tender.submissionDeadline} />}
                </div>
              </TableCell>
              <TableCell>
                <ComplianceCell progress={tender.checklist} />
              </TableCell>
              <TableCell>
                <RiskCountsInline risks={tender.risks} />
              </TableCell>
              <TableCell className="pr-4">
                <Link
                  href={`/tenders/${tender.id}`}
                  aria-label={`Open ${tender.title}`}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
