"use client";

import { useEffect } from "react";
import { Button, Card } from "@/components/ui";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No error-tracking service is wired up yet — this is the one place
    // that should call it (e.g. Sentry.captureException) once there is one.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Card className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          An unexpected error occurred loading this page. You can try again,
          or go back home.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go home
          </Button>
        </div>
      </Card>
    </div>
  );
}
