"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import { readBaseUrl, readSessions, removeSession } from "@/lib/session-store";
import type { Session, Task } from "@/lib/types";
import { AppShell } from "@/components/layout/navbar";
import { Button, StatusBox } from "@/components/ui";
import { TaskCard } from "@/components/task";

export default function ClientTasksPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState(
    "Login as Client, then post and manage your tasks here.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState<string | null>(null);

  const loadTasks = useCallback(async (currentSession: Session) => {
    setBusy("refresh");
    const response = await tasksApi.myTasks(readBaseUrl(), currentSession.token);
    setBusy(null);
    if (response.ok && response.data) {
      setTasks(response.data);
      setTone("success");
      setStatus("Your posted tasks are up to date.");
    } else {
      if (response.status === 401 || response.status === 403) {
        removeSession("client");
        setSession(undefined);
        setTasks([]);
        setTone("error");
        setStatus("Your session expired. Please log in again.");
        router.replace("/login");
        return;
      }
      setTone("error");
      setStatus(response.error ?? "Could not load your tasks.");
    }
  }, [router]);

  useEffect(() => {
    const clientSession = readSessions().client;
    setSession(clientSession);
    if (clientSession) {
      void loadTasks(clientSession);
    }
  }, [loadTasks]);

  async function refresh() {
    if (!session) return;
    await loadTasks(session);
  }

  async function deleteTask(taskId: number) {
    if (!session) return;
    setBusy(`delete-${taskId}`);
    const response = await tasksApi.deleteTask(readBaseUrl(), session.token, taskId);
    setBusy(null);
    if (response.ok) {
      setTasks((current) => current.filter((t) => t.id !== taskId));
      setTone("success");
      setStatus(`Task #${taskId} deleted.`);
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not delete task.");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                Client workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
                Your posted tasks
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Manage the tasks you've posted, review incoming bids, and post
                new work for Taskers to bid on.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void refresh()}
                disabled={!session || busy === "refresh"}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </Button>
              <Link href="/bids">
                <Button type="button">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Post a task
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <StatusBox
          tone={session ? tone : "error"}
          message={
            session
              ? status
              : "Login as Client to post tasks and review bids."
          }
        />

        {!session && (
          <section className="rounded-lg border border-brand-100 bg-brand-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  No client session found
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Sign in as Client to see the tasks you've posted.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
                  href="/login"
                >
                  Login
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand-500"
                  href="/register"
                >
                  Register
                </Link>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Posted tasks</h2>
            <span className="rounded-md bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
              {tasks.length} task{tasks.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {tasks.length === 0 ? (
              <StatusBox message="You haven't posted any tasks yet. Post one to start receiving bids." />
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Link href="/bids">
                        <Button type="button" variant="secondary">
                          View bids
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => void deleteTask(task.id)}
                        disabled={busy === `delete-${task.id}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
