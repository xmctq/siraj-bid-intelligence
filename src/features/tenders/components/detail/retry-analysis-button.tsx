"use client";

import { Loading03Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

export function RetryAnalysisButton({ tenderId }: { tenderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function retry() {
    setPending(true);
    try {
      await apiFetch(`/api/tenders/${tenderId}/analyze`, { method: "POST" });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setPending(false);
    }
  }

  return (
    <Button size="sm" onClick={retry} disabled={pending}>
      <HugeiconsIcon icon={pending ? Loading03Icon : RefreshIcon} size={14} className={pending ? "animate-spin" : ""} />
      Retry analysis
    </Button>
  );
}
