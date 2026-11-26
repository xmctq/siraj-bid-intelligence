import { AiBrain01Icon, CheckListIcon, FileSearchIcon, MessageQuestionIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SampleDocuments } from "@/features/tenders/components/sample-documents";
import { UploadDropzone } from "@/features/tenders/components/upload-dropzone";

export const metadata: Metadata = { title: "Upload tender" };

const STEPS = [
  { icon: FileSearchIcon, title: "Text extraction", text: "Every page is extracted and indexed so findings can cite their source." },
  {
    icon: AiBrain01Icon,
    title: "AI analysis",
    text: "Key facts, eligibility, deadlines, deliverables and technical requirements in a validated structure.",
  },
  { icon: CheckListIcon, title: "Checklist & risks", text: "A compliance checklist plus critical requirements, gaps and risks." },
  { icon: MessageQuestionIcon, title: "Ask the document", text: "Question the tender and get answers with page references." },
];

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload a tender"
        description="Add a government tender or RFP in PDF format. Analysis usually takes under a minute."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UploadDropzone />
        </div>
        <aside className="space-y-6 lg:col-span-2">
          <section aria-labelledby="pipeline-heading" className="rounded-xl border bg-card p-4">
            <h2 id="pipeline-heading" className="text-sm font-semibold">
              What happens next
            </h2>
            <ol className="mt-3 space-y-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-primary">
                    <HugeiconsIcon icon={step.icon} size={16} strokeWidth={1.8} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      <span className="sr-only">Step {index + 1}: </span>
                      {step.title}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="samples-heading">
            <h2 id="samples-heading" className="mb-2 text-sm font-semibold">
              No tender at hand? Try a sample
            </h2>
            <SampleDocuments />
          </section>
        </aside>
      </div>
    </div>
  );
}
