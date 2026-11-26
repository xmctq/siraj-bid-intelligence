import { connection } from "next/server";
import type { ReactNode } from "react";
import { getWorkspaceCounts, type WorkspaceCounts } from "@/features/tenders/server/queries";
import { AiStatusCard } from "./ai-status-card";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { TopBar } from "./top-bar";
import { WorkspaceCard } from "./workspace-card";

const EMPTY_COUNTS: WorkspaceCounts = { tenders: 0, analyzing: 0, openCriticalRisks: 0, upcomingDeadlines: 0, pagesIndexed: 0 };

async function loadCounts(): Promise<WorkspaceCounts> {
  try {
    return await getWorkspaceCounts();
  } catch (error) {
    // The shell must still render (pages show their own error states).
    console.error("[shell] could not load workspace counts", error);
    return EMPTY_COUNTS;
  }
}

export async function AppShell({ children }: { children: ReactNode }) {
  await connection(); // Live counts: never prerender the shell at build time.
  const counts = await loadCounts();
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="bg-command px-4 pt-5 pb-6">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-6">
          <SidebarNav counts={counts} />
        </div>
        <div className="space-y-3 border-t p-3">
          <AiStatusCard counts={counts} />
          <WorkspaceCard />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar counts={counts} />
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
