"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Plus, RefreshCw, Trash2 } from "lucide-react";
import { taskArmyApi } from "@/lib/api";
import { readBaseUrl, readSessions } from "@/lib/session-store";
import type { Session, Task, TaskPhase } from "@/lib/types";
import { AppShell } from "@/components/app-shell";
import {
  Button,
  Card,
  Field,
  SelectField,
  StatusBox,
  TextArea,
} from "@/components/ui";
import { TaskCard } from "@/components/task-card";

const taskPhases: Array<{ label: string; value: TaskPhase }> = [
  { label: "Open for bids", value: "open" },
  { label: "Assigned", value: "assigned" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function TaskerTasksPage() {
  const [session, setSession] = useState<Session>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("Clean my apartment");
  const [description, setDescription] = useState(
    "Need a full cleaning this weekend.",
  );
  const [budget, setBudget] = useState("80");
  const [deadline, setDeadline] = useState("2026-05-10T12:00");
  const [editTaskId, setEditTaskId] = useState("1");
  const [editTitle, setEditTitle] = useState("Clean my apartment and balcony");
  const [editBudget, setEditBudget] = useState("100");
  const [phaseTaskId, setPhaseTaskId] = useState("1");
  const [phase, setPhase] = useState<TaskPhase>("open");
  const [deleteTaskId, setDeleteTaskId] = useState("1");
  const [status, setStatus] = useState(
    "Login as Tasker, then create and manage tasks here.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const currentSession = readSessions().tasker;
    setSession(currentSession);
    if (currentSession) {
      void refresh(currentSession);
    }
  }, []);

  async function refresh(currentSession?: Session) {
    const activeSession = currentSession ?? session;
    if (!activeSession) return;
    setBusy("refresh");
    const response = await taskArmyApi.myTasks(
      readBaseUrl(),
      activeSession.token,
    );
    setBusy(null);
    if (response.ok && response.data) {
      setTasks(response.data);
      setTone("success");
      setStatus("Task list updated.");
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not load tasks.");
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setBusy("create");
    const response = await taskArmyApi.createTask(
      readBaseUrl(),
      session.token,
      {
        title,
        description,
        budget: Number(budget),
        deadline: new Date(deadline).toISOString(),
      },
    );
    setBusy(null);

    if (response.ok && response.data) {
      setTone("success");
      setStatus(`Task #${response.data.id} created.`);
      setEditTaskId(String(response.data.id));
      setPhaseTaskId(String(response.data.id));
      setDeleteTaskId(String(response.data.id));
      await refresh();
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not create task.");
    }
  }

  async function updateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setBusy("update");
    const response = await taskArmyApi.updateTask(
      readBaseUrl(),
      session.token,
      Number(editTaskId),
      {
        title: editTitle,
        budget: Number(editBudget),
      },
    );
    setBusy(null);
    setTone(response.ok ? "success" : "error");
    setStatus(
      response.ok
        ? "Task updated."
        : (response.error ?? "Could not update task."),
    );
    if (response.ok) await refresh();
  }

  async function deleteTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setBusy("delete");
    const response = await taskArmyApi.deleteTask(
      readBaseUrl(),
      session.token,
      Number(deleteTaskId),
    );
    setBusy(null);
    setTone(response.ok ? "success" : "error");
    setStatus(
      response.ok
        ? "Task deleted."
        : (response.error ?? "Could not delete task."),
    );
    if (response.ok)
      setTasks((current) =>
        current.filter((task) => task.id !== Number(deleteTaskId)),
      );
  }

  async function updatePhase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setBusy("phase");
    const response = await taskArmyApi.updateTask(
      readBaseUrl(),
      session.token,
      Number(phaseTaskId),
      {
        status: phase,
      },
    );
    setBusy(null);
    setTone(response.ok ? "success" : "error");
    setStatus(
      response.ok
        ? `Task moved to ${phase.replace("_", " ")}.`
        : (response.error ?? "Could not update task phase."),
    );
    if (response.ok) await refresh();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-lg bg-brand-900 p-6 text-white shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
                Tasker workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                Post and manage customer jobs
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-100">
                Create real tasks with budgets and deadlines, then keep your
                posted work clean and accurate.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={refresh}
              disabled={!session || busy === "refresh"}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh jobs
            </Button>
          </div>
        </section>

        <StatusBox
          tone={session ? tone : "error"}
          message={
            session
              ? status
              : "You need to login as Tasker before using this page."
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-ink">Create task</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Use this form to publish a new job. Once created, TaskArmy
                workers can view and bid on it.
              </p>
              <form
                className="mt-4 grid gap-4 sm:grid-cols-2"
                onSubmit={createTask}
              >
                <Field
                  label="Title"
                  value={title}
                  onChange={setTitle}
                  required
                />
                <Field
                  label="Budget"
                  type="number"
                  value={budget}
                  onChange={setBudget}
                  required
                />
                <Field
                  label="Deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={setDeadline}
                  required
                />
                <div className="sm:col-span-2">
                  <TextArea
                    label="Description"
                    value={description}
                    onChange={setDescription}
                  />
                </div>
                <Button type="submit" disabled={!session || busy === "create"}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create task
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-ink">My tasks</h2>
              <div className="mt-4 space-y-3">
                {tasks.length === 0 ? (
                  <StatusBox message="No tasks loaded yet. Click refresh after logging in." />
                ) : (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      action={
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setEditTaskId(String(task.id));
                            setPhaseTaskId(String(task.id));
                            setDeleteTaskId(String(task.id));
                            setEditTitle(task.title);
                            setEditBudget(String(task.budget));
                            if (isTaskPhase(task.status)) setPhase(task.status);
                          }}
                        >
                          Select task
                        </Button>
                      }
                    />
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-ink">Update task</h2>
              <form className="mt-4 space-y-4" onSubmit={updateTask}>
                <Field
                  label="Task ID"
                  type="number"
                  value={editTaskId}
                  onChange={setEditTaskId}
                />
                <Field
                  label="Title"
                  value={editTitle}
                  onChange={setEditTitle}
                />
                <Field
                  label="Budget"
                  type="number"
                  value={editBudget}
                  onChange={setEditBudget}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!session || busy === "update"}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Update
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-ink">Task phase</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Move a task through the real work lifecycle after a bid is
                accepted.
              </p>
              <form className="mt-4 space-y-4" onSubmit={updatePhase}>
                <Field
                  label="Task ID"
                  type="number"
                  value={phaseTaskId}
                  onChange={setPhaseTaskId}
                />
                <SelectField
                  label="Phase"
                  value={phase}
                  onChange={(value) => setPhase(value as TaskPhase)}
                  options={taskPhases}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!session || busy === "phase"}
                >
                  Update phase
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-ink">Delete task</h2>
              <form className="mt-4 space-y-4" onSubmit={deleteTask}>
                <Field
                  label="Task ID"
                  type="number"
                  value={deleteTaskId}
                  onChange={setDeleteTaskId}
                />
                <Button
                  type="submit"
                  variant="danger"
                  className="w-full"
                  disabled={!session || busy === "delete"}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function isTaskPhase(value: string | undefined): value is TaskPhase {
  return taskPhases.some((phaseOption) => phaseOption.value === value);
}
