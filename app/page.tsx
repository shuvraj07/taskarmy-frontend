"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, RefreshCw } from "lucide-react";
import { taskArmyApi } from "@/lib/api";
import { readBaseUrl, readSessions } from "@/lib/session-store";
import { Button, StatusBox } from "@/components/ui";

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState("Loading task count...");
  const [busy, setBusy] = useState(false);

  async function loadCount() {
    const session = readSessions().taskarmy;

    if (!session) {
      setCount(null);
      setStatus("Login as TaskArmy to see the live posted task count.");
      return;
    }

    setBusy(true);
    const response = await taskArmyApi.browseTasks(
      readBaseUrl(),
      session.token,
    );
    setBusy(false);

    if (response.ok && response.data) {
      setCount(response.data.length);
      setStatus("Live task count loaded.");
      return;
    }

    setCount(null);
    setStatus(response.error ?? "Could not load task count.");
  }

  useEffect(() => {
    void loadCount();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-900 px-4 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-white/10 bg-white p-6 shadow-soft">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-brand-100 text-brand-700">
            <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-brand-700">
            Posted tasks
          </p>
          <h1 className="mt-2 text-6xl font-semibold tracking-normal text-ink">
            {count ?? "--"}
          </h1>
          <div className="mt-5">
            <StatusBox
              message={status}
              tone={count === null ? "neutral" : "success"}
            />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadCount()}
              disabled={busy}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
              href="/taskarmy/tasks"
            >
              Browse
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Quick access
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Login or register
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Choose your role to continue as a task poster (Tasker) or a bidder
            (TaskArmy).
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href="/login?role=tasker"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Login as Tasker
            </Link>
            <Link
              href="/register?role=tasker"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand-500"
            >
              Register as Tasker
            </Link>
            <Link
              href="/login?role=taskarmy"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Login as TaskArmy
            </Link>
            <Link
              href="/register?role=taskarmy"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand-500"
            >
              Register as TaskArmy
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
