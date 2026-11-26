import { CloudUploadIcon, Files01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/status/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tenderListQuerySchema, type TenderStatus } from "@/domain/api";
import { TendersTable } from "@/features/tenders/components/tenders-table";
import { listTenders } from "@/features/tenders/server/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tenders" };

const STATUS_FILTERS: { value?: TenderStatus; label: string }[] = [
  { label: "All" },
  { value: "ready", label: "Analyzed" },
  { value: "processing", label: "Analyzing" },
  { value: "failed", label: "Failed" },
];

function buildHref(params: { q?: string; status?: string; page?: number }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/tenders?${query}` : "/tenders";
}

export default async function TendersPage({ searchParams }: PageProps<"/tenders">) {
  const query = tenderListQuerySchema.parse(await searchParams);
  const { items, total, page, pageSize } = await listTenders(query);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const filtered = Boolean(query.q || query.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenders"
        description="Every uploaded tender with its deadline, compliance progress and risk profile."
        actions={
          <Button asChild>
            <Link href="/tenders/new">
              <HugeiconsIcon icon={CloudUploadIcon} size={16} />
              Upload tender
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter by status" className="flex w-fit gap-1 rounded-lg border bg-card p-1">
          {STATUS_FILTERS.map((filter) => {
            const active = query.status === filter.value;
            return (
              <Link
                key={filter.label}
                href={buildHref({ q: query.q, status: filter.value })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  active && "bg-muted text-foreground",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
        <form action="/tenders" role="search" className="relative w-full sm:w-72">
          {query.status && <input type="hidden" name="status" value={query.status} />}
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            type="search"
            defaultValue={query.q}
            placeholder="Search title, issuer, reference…"
            aria-label="Search tenders"
            className="bg-card pl-8"
          />
        </form>
      </div>

      <section className="rounded-xl border bg-card">
        {items.length === 0 ? (
          <EmptyState
            icon={Files01Icon}
            title={filtered ? "No tenders match your filters" : "No tenders yet"}
            description={filtered ? "Try a different search term or status." : "Upload a tender PDF to get started."}
            action={
              <Button asChild variant="outline" size="sm">
                <Link href={filtered ? "/tenders" : "/tenders/new"}>{filtered ? "Clear filters" : "Upload tender"}</Link>
              </Button>
            }
            className="m-4"
          />
        ) : (
          <TendersTable tenders={items} />
        )}
        {total > 0 && (
          <footer className="flex items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
            <span className="tabular">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" aria-disabled={page <= 1} className={cn(page <= 1 && "pointer-events-none opacity-50")}>
                <Link href={buildHref({ ...query, page: page - 1 })} tabIndex={page <= 1 ? -1 : undefined}>
                  Previous
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" aria-disabled={page >= lastPage} className={cn(page >= lastPage && "pointer-events-none opacity-50")}>
                <Link href={buildHref({ ...query, page: page + 1 })} tabIndex={page >= lastPage ? -1 : undefined}>
                  Next
                </Link>
              </Button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
