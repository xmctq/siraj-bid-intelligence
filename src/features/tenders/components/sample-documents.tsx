"use client";

import { Download04Icon, Loading03Icon, Pdf01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SAMPLE_FILES } from "../samples";
import { uploadTenderFile } from "./upload-dropzone";

/** One-click demo: fetches a bundled sample PDF and sends it through the normal upload pipeline. */
export function SampleDocuments() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function analyzeSample(fileName: string) {
    setBusy(fileName);
    try {
      const response = await fetch(`/samples/${fileName}`);
      if (!response.ok) throw new Error("Could not load the sample document.");
      const file = new File([await response.blob()], fileName, { type: "application/pdf" });
      const result = await uploadTenderFile(file);
      if (result.duplicate) toast.info("Sample already analyzed. Opening it.");
      router.push(`/tenders/${result.id}`);
    } catch (error) {
      toast.error((error as Error).message);
      setBusy(null);
    }
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {SAMPLE_FILES.map((sample) => (
        <li key={sample.fileName} className="flex items-center gap-3 p-3">
          <HugeiconsIcon icon={Pdf01Icon} size={18} className="shrink-0 text-danger" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{sample.title}</p>
            <p className="text-xs text-muted-foreground">
              {sample.issuer} · {sample.pages} pages
            </p>
          </div>
          <Button asChild variant="ghost" size="icon" aria-label={`Download ${sample.title}`}>
            <a href={`/samples/${sample.fileName}`} download>
              <HugeiconsIcon icon={Download04Icon} size={16} />
            </a>
          </Button>
          <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => analyzeSample(sample.fileName)}>
            {busy === sample.fileName && <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />}
            Use sample
          </Button>
        </li>
      ))}
    </ul>
  );
}
