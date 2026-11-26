"use client";

import { ArrowRight01Icon, CloudUploadIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { WorkspaceCounts } from "@/features/tenders/server/queries";
import { BrandMark } from "./brand";
import { MobileNav } from "./mobile-nav";
import { sectionForPath } from "./nav-items";

export function TopBar({ counts }: { counts: WorkspaceCounts }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const section = sectionForPath(pathname);

  // ⌘K / Ctrl+K focuses tender search, as in most command-center tools.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q")?.toString().trim();
    router.push(q ? `/tenders?q=${encodeURIComponent(q)}` : "/tenders");
    searchRef.current?.blur();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-1 lg:hidden">
        <MobileNav counts={counts} />
        <Link href="/" aria-label="Siraj home" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandMark className="size-7 text-primary" />
        </Link>
      </div>
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-[13px] sm:flex">
        <span className="text-muted-foreground">{section.group}</span>
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-muted-foreground/60" aria-hidden />
        <span className="font-medium">{section.label}</span>
      </nav>

      <form role="search" onSubmit={onSearch} className="relative ml-auto w-full max-w-72">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={searchRef}
          name="q"
          type="search"
          placeholder="Search tenders…"
          aria-label="Search tenders"
          className="h-9 w-full rounded-lg border bg-card pr-12 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
          Ctrl K
        </kbd>
      </form>

      {counts.analyzing > 0 && (
        <span className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium md:inline-flex">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          {counts.analyzing} analyzing
        </span>
      )}
      <Button asChild size="sm" className="hidden h-9 sm:inline-flex">
        <Link href="/tenders/new">
          <HugeiconsIcon icon={CloudUploadIcon} size={16} />
          Upload tender
        </Link>
      </Button>
    </header>
  );
}
