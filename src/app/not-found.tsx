import { FileNotFoundIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { EmptyState } from "@/components/status/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16">
      <EmptyState
        icon={FileNotFoundIcon}
        title="Page not found"
        description="This tender may have been deleted, or the link is incorrect."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/tenders">Back to tenders</Link>
          </Button>
        }
      />
    </div>
  );
}
