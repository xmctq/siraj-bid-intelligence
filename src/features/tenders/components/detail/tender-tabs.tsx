"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { isTenderTab, type TenderTab } from "./tabs-config";

type TabDef = { value: TenderTab; label: string; count?: number; content: ReactNode };

/** Tabs whose selection is mirrored to ?tab= so views are linkable and survive refreshes. */
export function TenderTabs({ initialTab, tabs }: { initialTab: TenderTab; tabs: TabDef[] }) {
  const [tab, setTab] = useState<TenderTab>(initialTab);

  function change(value: string) {
    if (!isTenderTab(value)) return;
    setTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <Tabs value={tab} onValueChange={change} className="gap-5">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList variant="line" className="w-max">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="px-3">
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground tabular">{t.count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
