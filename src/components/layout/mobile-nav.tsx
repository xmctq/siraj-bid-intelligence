"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { WorkspaceCounts } from "@/features/tenders/server/queries";
import { AiStatusCard } from "./ai-status-card";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ counts }: { counts: WorkspaceCounts }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation">
          <HugeiconsIcon icon={Menu01Icon} size={20} strokeWidth={1.8} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 bg-sidebar p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Main navigation</SheetDescription>
        <div className="bg-command px-4 py-5">
          <Brand />
        </div>
        <div className="flex-1 px-3 py-5">
          <SidebarNav counts={counts} onNavigate={() => setOpen(false)} />
        </div>
        <div className="p-3">
          <AiStatusCard counts={counts} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
