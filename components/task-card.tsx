"use client";

import type { Task } from "@/lib/types";

export function TaskCard({
  task,
  action,
  variant = "compact"
}: {
  task: Task;
  action?: React.ReactNode;
  variant?: "compact" | "marketplace";
}) {
  const poster = getPoster(task);
  const postedTime = task.created_at ? formatDateTime(task.created_at) : "Recently posted";
  const deadline = task.deadline ? formatDateTime(task.deadline) : "Flexible";

  if (variant === "marketplace") {
    return (
      <article className="rounded-lg border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-100 text-sm font-bold text-brand-700">
              {poster.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{poster.name}</p>
              <p className="truncate text-xs font-medium text-muted">{poster.email || "Verified tasker"}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
            ${task.budget}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-base font-semibold text-ink">{task.title}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
            {task.description || "No description provided."}
          </p>
        </div>

        <div className="mt-5 grid gap-2 text-xs font-medium text-muted sm:grid-cols-2">
          <span className="rounded-md bg-paper px-3 py-2">Posted {postedTime}</span>
          <span className="rounded-md bg-paper px-3 py-2">Due {deadline}</span>
          <span className="rounded-md bg-paper px-3 py-2">Task #{task.id}</span>
          <span className="rounded-md bg-paper px-3 py-2">{formatStatus(task.status)}</span>
        </div>

        {action && <div className="mt-5">{action}</div>}
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-line bg-white p-4 transition hover:border-brand-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{task.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{task.description || "No description provided."}</p>
        </div>
        <span className="w-fit rounded-md bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
          ${task.budget}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted">
        <span className="rounded bg-paper px-2 py-1">ID {task.id}</span>
        {task.status && <span className="rounded bg-paper px-2 py-1">{task.status}</span>}
        {task.deadline && <span className="rounded bg-paper px-2 py-1">Due {new Date(task.deadline).toLocaleDateString()}</span>}
        {task.accepted_bid_id && <span className="rounded bg-mint-100 px-2 py-1 text-mint-700">Bid {task.accepted_bid_id} accepted</span>}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </article>
  );
}

function getPoster(task: Task) {
  const name =
    task.poster?.full_name ||
    task.poster?.name ||
    task.owner?.full_name ||
    task.owner?.name ||
    task.owner_name ||
    task.tasker_name ||
    task.posted_by ||
    (task.owner_id ? `Tasker #${task.owner_id}` : "Tasker");

  const email = task.poster?.email || task.owner?.email || task.owner_email || task.tasker_email;

  return {
    name,
    email,
    initials: name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatStatus(status?: string) {
  if (!status) return "Open for bids";
  return status.replaceAll("_", " ");
}
