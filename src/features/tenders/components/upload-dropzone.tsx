"use client";

import { Cancel01Icon, CloudUploadIcon, Loading03Icon, Pdf01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/status/states";
import { MAX_UPLOAD_BYTES } from "@/domain/api";
import { apiFetch } from "@/lib/api-client";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

type UploadResponse = { id: string; duplicate: boolean };

export function validatePdfFile(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF documents are supported.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return `This file is ${formatBytes(file.size)}. The limit is 4 MB.`;
  return null;
}

export async function uploadTenderFile(file: File): Promise<UploadResponse> {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<UploadResponse>("/api/tenders", { method: "POST", body });
}

export function UploadDropzone() {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  function selectFile(candidate: File | undefined) {
    if (!candidate) return;
    const problem = validatePdfFile(candidate);
    setError(problem);
    setFile(problem ? null : candidate);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function submit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadTenderFile(file);
      if (result.duplicate) toast.info("This document was already uploaded. Opening the existing analysis.");
      router.push(`/tenders/${result.id}`);
    } catch (uploadError) {
      setError((uploadError as Error).message);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-14 text-center transition-colors",
          "hover:border-primary/50 hover:bg-brand-soft/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
          dragging && "border-primary bg-brand-soft/60",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-primary">
          <HugeiconsIcon icon={CloudUploadIcon} size={24} strokeWidth={1.7} aria-hidden />
        </span>
        <span className="mt-4 text-sm font-medium">
          Drop a tender PDF here, or <span className="text-primary underline underline-offset-4">browse</span>
        </span>
        <span className="mt-1 text-xs text-muted-foreground">Text-based PDF · up to 4 MB · max 150 pages</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
      </label>

      {file && (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-danger-soft text-danger">
            <HugeiconsIcon icon={Pdf01Icon} size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          {!uploading && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove file"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </Button>
          )}
        </div>
      )}

      {error && <ErrorState title="Upload failed" description={error} />}

      <Button className="w-full sm:w-auto" size="lg" disabled={!file || uploading} onClick={submit}>
        {uploading ? (
          <>
            <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
            Uploading and extracting text…
          </>
        ) : (
          "Upload and analyze"
        )}
      </Button>
    </div>
  );
}
