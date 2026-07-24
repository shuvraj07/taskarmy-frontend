import { tasksApi } from "@/features/tasks/api/tasks";
import { bidsApi } from "@/features/bids/api/bids";
import type { ApiFile } from "../api/files";
import type { Role } from "@/lib/types";

export type ApiTask = {
  id: number;
  created_by?: number;
  owner_id?: number;
  tasker_id?: number;
  poster?: { id?: number };
  owner?: { id?: number };
  title?: string;
  status?: string;
  files?: ApiFile[];
};

export type TaskFile = {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: Role;
  uploadedAt: string;
  url: string;
};

// These statuses mean the task was already submitted before this page load.
// Used only to restore the step from the server on the first successful load.
export const SUBMITTED_STATUSES = [
  "submitted",
  "completed",
  "approved",
  "in_review",
];

export function getTaskOwnerId(task: ApiTask): number | null {
  return (
    task.created_by ??
    task.owner_id ??
    task.tasker_id ??
    task.poster?.id ??
    task.owner?.id ??
    null
  );
}

function getFileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "file";
}

export function splitTaskFiles(
  data: ApiFile[],
  ownerId: number | null,
): { briefs: TaskFile[]; deliverables: TaskFile[] } {
  const mapped: TaskFile[] = data.map((f) => {
    let uploadedBy: Role = "client";
    if (f.uploader_role) {
      // The backend still reports its original role names here.
      uploadedBy = f.uploader_role === "tasker" ? "client" : "tasker";
    } else if (ownerId !== null) {
      uploadedBy = f.uploader_id === ownerId ? "client" : "tasker";
    }
    return {
      id: String(f.id),
      name: f.file_name,
      size: "",
      type: getFileExt(f.file_name),
      uploadedBy,
      uploadedAt: new Date(f.created_at).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      url: f.file_url,
    };
  });

  return {
    briefs: mapped.filter((f) => f.uploadedBy === "client"),
    deliverables: mapped.filter((f) => f.uploadedBy === "tasker"),
  };
}

export async function fetchTaskWithFallback(
  baseUrl: string,
  token: string,
  taskId: string,
  role: Role,
): Promise<ApiTask | null> {
  try {
    const directRes = await fetch(`${baseUrl}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (directRes.ok) return directRes.json();

    const listResponse =
      role === "client"
        ? await tasksApi.myTasks(baseUrl, token)
        : await tasksApi.browseTasks(baseUrl, token);
    const tasks = listResponse.data ?? [];
    let task: ApiTask | undefined = tasks.find(
      (item) => String(item.id) === String(taskId),
    );

    if (!task && role === "tasker") {
      const bidsResponse = await bidsApi.myBids(baseUrl, token);
      const acceptedBid = (bidsResponse.data ?? []).find(
        (bid) => bid.status === "accepted" && String(bid.task_id) === String(taskId),
      );
      if (acceptedBid) {
        task = {
          id: Number(taskId),
          status: "assigned",
          title: `Accepted task #${taskId}`,
        };
      }
    }

    return task ?? null;
  } catch (error) {
    console.error("Error fetching task:", error);
    return null;
  }
}

// Uploads files one at a time and stops at the first failure, reporting
// per-file completion progress as it goes. Kept independent of React state
// and of the fake "trickle" progress animation a caller may layer on top of
// uploadOne, so the actual sequencing/failure-propagation logic is testable
// without touching hooks or timers.
export async function uploadFilesSequentially(
  files: File[],
  uploadOne: (file: File) => Promise<{ ok: boolean; error?: string }>,
  onProgress: (percentComplete: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  for (let i = 0; i < files.length; i++) {
    const result = await uploadOne(files[i]);
    if (!result.ok) {
      return { ok: false, error: result.error ?? "Upload failed" };
    }
    onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return { ok: true };
}

// Errors that describe real, ongoing state for the file-exchange page —
// always derivable from current query/auth state, so a caller never has to
// remember to clear one when the underlying condition changes.
export function derivePassiveFileExchangeError(args: {
  notLoggedIn: boolean;
  taskNotFound: boolean;
  taskId: string;
  filesErrorMessage: string | null;
}): string | null {
  if (args.notLoggedIn) return "Not logged in. Please login first.";
  if (args.taskNotFound) {
    return `Task #${args.taskId} not found or you don't have access.`;
  }
  return args.filesErrorMessage;
}
