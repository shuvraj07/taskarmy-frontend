"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Send } from "lucide-react";
import { taskArmyApi } from "@/lib/api";
import { readBaseUrl, readSessions } from "@/lib/session-store";
import type { Session, Task } from "@/lib/types";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Field, StatusBox, TextArea } from "@/components/ui";
import { TaskCard } from "@/components/task-card";

export default function TaskArmyTasksPage() {
  const [session, setSession] = useState<Session>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState("1");
  const [amount, setAmount] = useState("75");
  const [message, setMessage] = useState("I can finish this carefully before the deadline.");
  const [status, setStatus] = useState("Login as TaskArmy, then browse open tasks and place bids here.");
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState<string | null>(null);

  const loadTasks = useCallback(async (currentSession: Session) => {
    if (!currentSession) return;
    setBusy("refresh");
    const response = await taskArmyApi.browseTasks(readBaseUrl(), currentSession.token);
    setBusy(null);
    if (response.ok && response.data) {
      setTasks(response.data);
      setTone("success");
      setStatus("Open task list updated.");
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not load open tasks.");
    }
  }, []);

  async function refresh() {
    if (!session) return;
    await loadTasks(session);
  }

  useEffect(() => {
    const workerSession = readSessions().taskarmy;
    setSession(workerSession);
    if (workerSession) {
      void loadTasks(workerSession);
    }
  }, [loadTasks]);

  async function placeBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setBusy("bid");
    const response = await taskArmyApi.placeBid(readBaseUrl(), session.token, Number(taskId), {
      amount: Number(amount),
      message
    });
    setBusy(null);
    setTone(response.ok ? "success" : "error");
    setStatus(response.ok ? `Bid #${response.data?.id ?? ""} submitted.` : response.error ?? "Could not place bid.");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">TaskArmy marketplace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">Find work worth bidding on</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Browse available jobs, select the right opportunity, and send a proposal that helps the tasker choose you.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => void refresh()} disabled={!session || busy === "refresh"}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh tasks
            </Button>
          </div>
        </section>

        <StatusBox
          tone={session ? tone : "error"}
          message={session ? status : "Login as TaskArmy to load live posted tasks and submit bids."}
        />

        {!session && (
          <section className="rounded-lg border border-brand-100 bg-brand-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">Browse posted work first</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Task listings are protected by your API, so sign in as TaskArmy to see real posted jobs.
                </p>
              </div>
              <div className="flex gap-2">
                <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700" href="/login">
                  Login
                </Link>
                <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand-500" href="/register">
                  Register
                </Link>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Open marketplace</h2>
              <span className="rounded-md bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
                {tasks.length} tasks
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {tasks.length === 0 ? (
                <StatusBox message="No posted tasks are available yet. When taskers publish jobs, they will appear here." />
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    variant="marketplace"
                    action={
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setTaskId(String(task.id));
                          setAmount(String(Math.max(1, Math.round(task.budget * 0.9))));
                        }}
                      >
                        Prepare bid
                      </Button>
                    }
                  />
                ))
              )}
            </div>
          </section>

          <Card className="xl:sticky xl:top-32 xl:self-start">
            <h2 className="text-lg font-semibold text-ink">Place bid</h2>
            <form className="mt-4 space-y-4" onSubmit={placeBid}>
              <Field label="Task ID" type="number" value={taskId} onChange={setTaskId} required />
              <Field label="Amount" type="number" value={amount} onChange={setAmount} required />
              <TextArea label="Bid message" value={message} onChange={setMessage} />
              <Button type="submit" className="w-full" disabled={!session || busy === "bid"}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Submit bid
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
