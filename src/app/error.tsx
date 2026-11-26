"use client";

import { ErrorState } from "@/components/status/states";
import { Button } from "@/components/ui/button";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-16">
      <ErrorState
        title="We couldn't load this page"
        description="A temporary problem occurred while loading data. Please try again."
        action={
          <Button size="sm" variant="outline" onClick={reset}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
