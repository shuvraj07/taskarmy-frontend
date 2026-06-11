"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  FolderOpen,
  ListChecks,
  MapPin,
  RotateCcw,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedTask } from "./types";

const deliveryLabel: Record<Exclude<FeedTask["category"], "All">, string> = {
  "Data Entry": "Remote · File delivery",
  "Content Writing": "Remote · Doc/Email",
  Design: "Remote · File delivery",
  "Media & Social": "Remote · Online posting",
};

type TaskStatus =
  | "open"
  | "in_progress"
  | "submitted"
  | "revision_requested"
  | "completed"
  | "disputed"
  | "cancelled";

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<
    TaskStatus,
    { label: string; className: string; icon: React.ReactNode | null }
  > = {
    open: {
      label: "Open",
      className: "bg-purple-50 text-purple-700 border-purple-200",
      icon: null,
    },
    in_progress: {
      label: "🔨 In Progress",
      className: "bg-purple-50 text-purple-700 border-purple-200",
      icon: null,
    },
    submitted: {
      label: "🔍 Needs Review",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />,
    },
    revision_requested: {
      label: "🔄 Revision Sent",
      className: "bg-orange-50 text-orange-700 border-orange-200",
      icon: <RotateCcw className="h-3 w-3 shrink-0" aria-hidden="true" />,
    },
    completed: {
      label: "✅ Completed",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />,
    },
    disputed: {
      label: "⚠️ Disputed",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-gray-50 text-gray-600 border-gray-200",
      icon: null,
    },
  };

  const cfg = config[status] ?? config.open;

  return (
    <span
      className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export function TaskBidCard({
  task,
  bidCount,
  onPlaceBid,
  onViewBids,
  onOpenChecklist,
  onComplete,
  onFiles,
  canPlaceBid,
  canViewBids,
  canComplete,
  showBidLoginPrompt,
  busy,
}: {
  task: FeedTask;
  bidCount: number;
  onPlaceBid: () => void;
  onViewBids: () => void;
  onOpenChecklist: () => void;
  onComplete: () => void;
  onFiles: () => void;
  canPlaceBid: boolean;
  canViewBids: boolean;
  canComplete: boolean;
  showBidLoginPrompt: boolean;
  busy: boolean;
}) {
  const router = useRouter();
  const showPlaceBid = canPlaceBid || showBidLoginPrompt;
  const taskStatus = task.liveTask?.status as TaskStatus | undefined;
  const isSubmitted = taskStatus === "submitted";
  const isCompleted = taskStatus === "completed";

  function handlePlaceBidClick() {
    if (canPlaceBid) {
      onPlaceBid();
    } else if (showBidLoginPrompt) {
      router.push("/login");
    }
  }

  function handleFilesClick() {
    if (canViewBids || canPlaceBid) {
      onFiles();
    } else {
      router.push("/login");
    }
  }

  return (
    <article className="min-h-[280px] rounded-lg border border-[#ded7ee] bg-white p-4 shadow-[0_8px_24px_rgba(41,24,79,0.1)]">
      <div className="flex min-w-0 gap-3">
        <div className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-md bg-[#f4efff]">
          <img
            className="h-full w-full object-cover"
            src={task.imageUrl}
            alt={`${task.title} task image`}
          />
          <div className="absolute inset-0 bg-black/5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-2">
            <h2 className="text-lg font-extrabold leading-tight text-[#21145f]">
              {task.title}
            </h2>
            {taskStatus && taskStatus !== "open" && (
              <TaskStatusBadge status={taskStatus} />
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#786fa0]">
            <span className="flex items-center gap-1">
              <Shield
                className="h-3 w-3 shrink-0 text-[#4f22bd]"
                aria-hidden="true"
              />
              Posted by{" "}
              <Link
                className="font-extrabold text-[#4f22bd] underline-offset-2 hover:underline"
                href={task.posterProfileHref}
              >
                {task.posterName}
              </Link>
            </span>
            <span aria-hidden="true" className="text-[#ded7ee]">
              ·
            </span>
            <span className="text-[#4f22bd]">{task.postedAgo}</span>
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#21145f]">
            <MapPin
              className="h-4 w-4 shrink-0 text-[#7448db]"
              aria-hidden="true"
            />
            <span className="truncate">
              {deliveryLabel[task.category]} · Due {task.time}
            </span>
          </p>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[#6d668a]">
            {task.description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#ded7ee] pt-3 text-[#21145f]">
        <Metric label="Budget" value={`Rs ${task.budget}`} />
        <Metric label="Bids" value={`${bidCount} offers`} />
        <Metric label="Category" value={task.category} />
      </div>

      {/* Tasker alert — work submitted needs review */}
      {canViewBids && isSubmitted && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
          <Clock
            className="h-4 w-4 shrink-0 text-blue-600"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-blue-700">
              Work submitted — action required
            </p>
            <p className="text-xs font-semibold text-blue-600">
              Review the files and approve or request a revision.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-blue-700"
            onClick={onFiles}
          >
            Review
          </button>
        </div>
      )}

      {/* Tasker — completed */}
      {canViewBids && isCompleted && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <p className="text-sm font-extrabold text-emerald-700">
            Task completed — payment pending
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#ded7ee] bg-white px-4 text-sm font-extrabold text-[#371184]"
          type="button"
          onClick={onOpenChecklist}
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Checklist
        </button>

        {(canViewBids || canPlaceBid) && (
          <button
            className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-extrabold transition ${
              isSubmitted && canViewBids
                ? "border-blue-400 bg-blue-600 text-white hover:bg-blue-700"
                : "border-[#4f22bd]/30 bg-[#f4efff] text-[#4f22bd]"
            }`}
            type="button"
            onClick={handleFilesClick}
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            {isSubmitted && canViewBids ? "Review Files" : "Files"}
          </button>
        )}

        {canViewBids && !isCompleted && (
          <button
            className="min-h-11 rounded-md border border-[#ded7ee] bg-white px-6 text-sm font-extrabold text-[#371184]"
            type="button"
            onClick={onViewBids}
          >
            View Bids
          </button>
        )}

        {showPlaceBid && (
          <button
            className="min-h-11 rounded-md bg-[#4f22bd] px-6 text-sm font-extrabold text-white"
            type="button"
            onClick={handlePlaceBidClick}
          >
            {canPlaceBid ? "Place Bid" : "Login to bid"}
          </button>
        )}

        {canComplete && !isCompleted && (
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md border border-[#ded7ee] bg-white text-[#371184]"
            type="button"
            title="Mark complete"
            aria-label="Mark complete"
            onClick={onComplete}
            disabled={busy}
          >
            <Check className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-[#ded7ee] last:border-r-0">
      <p className="truncate text-xs font-semibold">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold">{value}</p>
    </div>
  );
}
