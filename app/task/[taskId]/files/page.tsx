"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  Download,
  FolderOpen,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  readActiveRole,
  readBaseUrl,
  readActiveSession,
  readCurrentUserId,
} from "@/lib/session-store";

function getApiUrl() {
  return readBaseUrl().replace(/\/$/, "");
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface TaskFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: "taskarmy" | "tasker";
  uploadedAt: string;
  url: string;
}

interface ApiFile {
  id: number;
  task_id: number | null;
  uploader_id: number;
  uploader_role?: string;
  file_url: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

interface ApiTask {
  id: number;
  created_by?: number;
  owner_id?: number;
  tasker_id?: number;
  poster?: { id: number };
  owner?: { id: number };
  title?: string;
  status?: string;
  files?: ApiFile[];
}

interface ApiBid {
  id: number;
  status?: string;
  task_id?: number;
}

type UserRole = "taskarmy" | "tasker";
type TaskArmyStep = "download" | "upload" | "submitted";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getFileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "file";
}

function fileIcon(ext: string) {
  const map: Record<string, string> = {
    pdf: "📄",
    xlsx: "📊",
    xls: "📊",
    doc: "📝",
    docx: "📝",
    png: "🖼️",
    jpg: "🖼️",
    jpeg: "🖼️",
    webp: "🖼️",
    zip: "🗜️",
    csv: "📋",
  };
  return map[ext] ?? "📁";
}

function extColor(ext: string) {
  const map: Record<string, string> = {
    pdf: "#EF4444",
    xlsx: "#22C55E",
    xls: "#22C55E",
    doc: "#3B82F6",
    docx: "#3B82F6",
    png: "#A855F7",
    jpg: "#A855F7",
    jpeg: "#A855F7",
    webp: "#A855F7",
    zip: "#F59E0B",
    csv: "#14B8A6",
  };
  return map[ext] ?? "#6B7280";
}

function getToken(): string {
  return readActiveSession()?.token ?? "";
}

function getCurrentUserId(): number | null {
  return readCurrentUserId();
}

function getTaskOwnerId(task: ApiTask): number | null {
  return (
    task.created_by ??
    task.owner_id ??
    task.tasker_id ??
    task.poster?.id ??
    task.owner?.id ??
    null
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TaskFilesPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId as string;

  const [role, setRole] = useState<UserRole>("tasker");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [taskOwnerId, setTaskOwnerId] = useState<number | null>(null);
  const [taskDetails, setTaskDetails] = useState<ApiTask | null>(null);

  const [taskerBriefFiles, setTaskerBriefFiles] = useState<TaskFile[]>([]);
  const [taskArmySubmittedFiles, setTaskArmySubmittedFiles] = useState<
    TaskFile[]
  >([]);

  const [taskArmyStep, setTaskArmyStep] = useState<TaskArmyStep>("download");

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const taskArmyFileInputRef = useRef<HTMLInputElement>(null);
  const taskerBriefInputRef = useRef<HTMLInputElement>(null);

  // ── Split raw API files into brief vs deliverable ──────────────────────────
  const splitAndSetFiles = useCallback(
    (
      data: ApiFile[],
      ownerId: number | null,
      userId: number | null,
      userRole: UserRole,
    ) => {
      console.log("🔍 Processing files:", data);
      console.log("🔍 Task Owner ID:", ownerId);
      console.log("🔍 Current User ID:", userId);
      console.log("🔍 Current Role:", userRole);

      if (!data || data.length === 0) {
        console.log("No files returned from API");
        setTaskerBriefFiles([]);
        setTaskArmySubmittedFiles([]);
        if (userRole === "taskarmy") setTaskArmyStep("download"); // ← fix
        return;
      }

      const mapped = data.map((f) => {
        let uploadedBy: "tasker" | "taskarmy" = "tasker";

        if (f.uploader_role) {
          uploadedBy = f.uploader_role === "tasker" ? "tasker" : "taskarmy";
        } else if (ownerId !== null) {
          uploadedBy = f.uploader_id === ownerId ? "tasker" : "taskarmy";
        } else {
          uploadedBy = "tasker";
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

      const briefs = mapped.filter((f) => f.uploadedBy === "tasker");
      const deliverables = mapped.filter((f) => f.uploadedBy === "taskarmy");

      setTaskerBriefFiles(briefs);
      setTaskArmySubmittedFiles(deliverables);

      if (userRole === "taskarmy") {
        if (deliverables.length > 0) {
          setTaskArmyStep("submitted");
        } else if (briefs.length > 0) {
          setTaskArmyStep("upload");
        } else {
          setTaskArmyStep("download");
        }
      }
    },
    [],
  );

  // ── Fetch task details and owner id ───────────────────────────────────────
  const fetchTaskDetails = useCallback(
    async (
      token: string,
      userRole: UserRole,
    ): Promise<{ ownerId: number | null; task: ApiTask | null }> => {
      const apiUrl = getApiUrl();
      try {
        console.log(
          `Fetching task ${taskId} details from ${apiUrl}/tasks/${taskId}...`,
        );
        const res = await fetch(`${apiUrl}/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(`Task API response status: ${res.status}`);

        if (res.ok) {
          const task: ApiTask = await res.json();
          console.log("Full task response:", JSON.stringify(task, null, 2));
          const ownerId = getTaskOwnerId(task);
          console.log("Extracted owner ID:", ownerId);
          return { ownerId, task };
        }

        console.warn(`Task detail endpoint returned ${res.status}`);

        const listPath = userRole === "tasker" ? "/tasks/my" : "/tasks/";
        const listRes = await fetch(`${apiUrl}${listPath}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!listRes.ok) {
          return { ownerId: null, task: null };
        }

        const tasks: ApiTask[] = await listRes.json();
        let task = tasks.find((item) => String(item.id) === String(taskId));

        if (!task && userRole === "taskarmy") {
          const bidsRes = await fetch(`${apiUrl}/tasks/my-bids`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (bidsRes.ok) {
            const bids: ApiBid[] = await bidsRes.json();
            const acceptedBid = bids.find(
              (bid) =>
                bid.status === "accepted" &&
                String(bid.task_id) === String(taskId),
            );
            if (acceptedBid) {
              task = {
                id: Number(taskId),
                status: "assigned",
                title: `Accepted task #${taskId}`,
              };
            }
          }
        }

        if (!task) return { ownerId: null, task: null };

        const ownerId = getTaskOwnerId(task);
        return { ownerId, task };
      } catch (error) {
        console.error("Error fetching task:", error);
        return { ownerId: null, task: null };
      }
    },
    [taskId],
  );

  // ── Fetch all files for this task ─────────────────────────────────────────
  const fetchTaskFiles = useCallback(
    async (
      token: string,
      ownerId: number | null,
      userId: number | null,
      userRole: UserRole,
      fallbackFiles: ApiFile[] = [],
    ) => {
      const apiUrl = getApiUrl();
      setLoadingFiles(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`${apiUrl}/files/task/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(`🔍 Files API response status: ${res.status}`);

        if (res.status === 404) {
          splitAndSetFiles(fallbackFiles, ownerId, userId, userRole);
          setLoadingFiles(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to load files (${res.status})`);
        }

        const data: ApiFile[] = await res.json();
        console.log(`🔍 API returned ${data.length} files:`, data);

        splitAndSetFiles(
          data.length > 0 ? data : fallbackFiles,
          ownerId,
          userId,
          userRole,
        );
      } catch (e: unknown) {
        console.error("Error fetching files:", e);
        setErrorMsg(e instanceof Error ? e.message : "Failed to load files");
      } finally {
        setLoadingFiles(false);
      }
    },
    [taskId, splitAndSetFiles],
  );

  // ── Init: role → task owner → files ───────────────────────────────────────
  useEffect(() => {
    const activeRole = readActiveRole();
    const userRole = activeRole === "taskarmy" ? "taskarmy" : "tasker";
    setRole(userRole);

    // reset step on every page load
    if (userRole === "taskarmy") setTaskArmyStep("download");

    const userId = getCurrentUserId();
    setCurrentUserId(userId);
    console.log("🔍 Current user ID:", userId);
    console.log("🔍 Current role:", userRole);
    console.log("🔍 Task ID from URL:", taskId);

    const token = getToken();
    if (!token) {
      setLoadingFiles(false);
      setErrorMsg("Not logged in. Please login first.");
      return;
    }

    fetchTaskDetails(token, userRole).then(({ ownerId, task }) => {
      setTaskOwnerId(ownerId);
      setTaskDetails(task);

      if (!task) {
        setErrorMsg(`Task #${taskId} not found or you don't have access.`);
        setLoadingFiles(false);
        return;
      }

      fetchTaskFiles(token, ownerId, userId, userRole, task.files ?? []);
    });
  }, [taskId, fetchTaskDetails, fetchTaskFiles]);

  // ── Upload files ─────────────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (selectedFiles: FileList, isTaskerUpload: boolean) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      setUploading(true);
      setUploadProgress(0);
      setErrorMsg(null);

      const token = getToken();
      const fileArray = Array.from(selectedFiles);
      const apiUrl = getApiUrl();

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const formData = new FormData();
        formData.append("file", file);

        try {
          const progressInterval = setInterval(() => {
            setUploadProgress((p) => Math.min(p + 5, 90));
          }, 100);

          console.log(
            `📤 Uploading ${file.name} to ${apiUrl}/files/upload?task_id=${taskId}...`,
          );
          const res = await fetch(`${apiUrl}/files/upload?task_id=${taskId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          clearInterval(progressInterval);

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.detail ?? `Upload failed (${res.status})`);
          }

          const uploadedFile = await res.json();
          console.log("✅ Uploaded file:", uploadedFile);
          setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
        } catch (e: unknown) {
          console.error("Upload error:", e);
          setErrorMsg(e instanceof Error ? e.message : "Upload failed");
          setUploading(false);
          setUploadProgress(0);
          return;
        }
      }

      setUploading(false);
      setUploadProgress(0);

      const refreshToken = getToken();
      if (refreshToken) {
        console.log("🔄 Refreshing files after upload...");
        await fetchTaskFiles(refreshToken, taskOwnerId, currentUserId, role);
      }
    },
    [taskId, role, taskOwnerId, currentUserId, fetchTaskFiles],
  );

  // ── Delete file ────────────────────────────────────────────────────────────
  const deleteFile = useCallback(
    async (id: string) => {
      const token = getToken();
      const apiUrl = getApiUrl();
      try {
        const res = await fetch(`${apiUrl}/files/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Delete failed (${res.status})`);

        const refreshToken = getToken();
        if (refreshToken) {
          await fetchTaskFiles(refreshToken, taskOwnerId, currentUserId, role);
        }
      } catch (e: unknown) {
        console.error("Delete error:", e);
        setErrorMsg(e instanceof Error ? e.message : "Delete failed");
      }
    },
    [fetchTaskFiles, taskOwnerId, currentUserId, role],
  );

  // ── Submit work (TaskArmy) ─────────────────────────────────────────────────
  const handleSubmitWork = async () => {
    if (taskArmySubmittedFiles.length === 0) {
      setErrorMsg("Please upload your completed work before submitting.");
      return;
    }
    setSubmitting(true);
    setTaskArmyStep("submitted");
    setSubmitting(false);
    setErrorMsg(null);
  };

  // ── Handle file drop ───────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (role === "tasker") {
      uploadFiles(e.dataTransfer.files, true);
    } else {
      uploadFiles(e.dataTransfer.files, false);
    }
  };

  // ── Refresh files ──────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetchTaskFiles(token, taskOwnerId, currentUserId, role);
  }, [fetchTaskFiles, taskOwnerId, currentUserId, role]);

  return (
    <div className="min-h-screen w-full bg-[#f8f6ff]">
      {/* Header */}
      <header
        className="sticky top-0 z-20 bg-gradient-to-br from-[#5b35c8] via-[#4c24b7] to-[#371184] px-4 pb-4 pt-safe-4 text-white shadow-[0_4px_24px_rgba(41,24,79,0.25)]"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition active:bg-white/30"
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold leading-tight tracking-tight sm:text-xl">
                File Exchange
              </p>
              <p className="truncate text-[11px] font-medium text-white/70">
                Task #{taskId}{" "}
                {taskDetails?.title ? `· ${taskDetails.title}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 transition active:bg-white/30"
              aria-label="Refresh files"
              onClick={handleRefresh}
            >
              <Loader2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="shrink-0 rounded-full bg-emerald-500/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white sm:px-3 sm:text-[11px]">
              {role === "taskarmy" ? "TASKARMY" : "TASKER"}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
            aria-hidden="true"
          />
          <p className="text-[11px] font-semibold leading-snug text-white/80">
            {role === "tasker"
              ? "Upload the task brief for TaskArmy, then download completed work when done."
              : "Download the task brief below, complete the work, then upload your deliverable."}
          </p>
        </div>
      </header>

      <main
        className="space-y-4 px-3 pb-8 pt-4 sm:px-4"
        style={{
          paddingBottom:
            "max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))",
        }}
      >
        {/* Error banner */}
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            ⚠️ {errorMsg}
            <button
              className="ml-2 underline"
              onClick={() => setErrorMsg(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {loadingFiles ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#4f22bd]" />
          </div>
        ) : !taskDetails ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center">
            <FolderOpen className="mx-auto mb-3 h-12 w-12 text-amber-400" />
            <p className="font-extrabold text-amber-700">Task Not Found</p>
            <p className="mt-1 text-sm text-amber-600">
              Task #{taskId} does not exist or you don't have access to it.
            </p>
            <p className="mt-2 text-xs text-amber-500">
              Make sure you've accepted a bid on this task first.
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white"
              onClick={() => router.push("/")}
            >
              Go Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* ════ TASKER VIEW ════ */}
            {role === "tasker" && (
              <>
                <Section
                  title="📤 Upload Task Brief"
                  subtitle="Upload instructions & reference files for TaskArmy"
                >
                  <DropZone
                    dragging={dragging}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    onDragOver={(e: React.DragEvent) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => taskerBriefInputRef.current?.click()}
                    label="Upload task brief for TaskArmy"
                  />
                  <input
                    ref={taskerBriefInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.docx,.zip,.csv,.txt"
                    onChange={(e) => {
                      if (e.target.files) uploadFiles(e.target.files, true);
                    }}
                  />
                  <FileList
                    files={taskerBriefFiles}
                    emptyText="No brief uploaded yet — upload files above for TaskArmy to download"
                    onDelete={deleteFile}
                    showDelete
                  />
                </Section>

                <Section
                  title="📥 Completed Work from TaskArmy"
                  subtitle="Files submitted by TaskArmy after finishing the task"
                >
                  {taskArmySubmittedFiles.length === 0 ? (
                    <EmptyWaiting text="Waiting for TaskArmy to submit completed work…" />
                  ) : (
                    <FileList
                      files={taskArmySubmittedFiles}
                      emptyText=""
                      showDelete={false}
                    />
                  )}
                </Section>
              </>
            )}

            {/* ════ TASKARMY VIEW ════ */}
            {role === "taskarmy" && (
              <>
                <StepIndicator currentStep={taskArmyStep} />

                <Section
                  title="📥 Step 1 — Download Task Brief"
                  subtitle="Download and read all files from the Tasker before starting"
                  highlight={taskArmyStep === "download"}
                >
                  {taskerBriefFiles.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-5 text-center">
                      <FolderOpen className="h-10 w-10 text-[#ded7ee]" />
                      <p className="text-xs font-semibold text-[#9CA3AF]">
                        No brief files available yet.
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        The Tasker needs to upload the task brief first.
                      </p>
                      <button
                        type="button"
                        className="mt-2 rounded-lg border border-[#4f22bd] bg-white px-4 py-2 text-xs font-bold text-[#4f22bd] transition hover:bg-[#f4efff]"
                        onClick={handleRefresh}
                      >
                        🔄 Refresh
                      </button>
                    </div>
                  ) : (
                    <>
                      <FileList
                        files={taskerBriefFiles}
                        emptyText=""
                        showDelete={false}
                      />
                      {taskArmyStep === "download" && (
                        <button
                          type="button"
                          className="mt-3 w-full rounded-xl bg-[#4f22bd] py-3 text-sm font-extrabold text-white transition hover:bg-[#3a1696]"
                          onClick={() => setTaskArmyStep("upload")}
                        >
                          📥 I've Downloaded & Read the Brief
                        </button>
                      )}
                    </>
                  )}
                </Section>

                <Section
                  title="📤 Step 2 — Upload Completed Work"
                  subtitle="Upload your deliverable after finishing the task"
                  highlight={taskArmyStep === "upload"}
                  locked={taskArmyStep === "download"}
                >
                  {taskArmyStep === "download" ? (
                    <LockedMessage text="Download the task brief first to unlock this section" />
                  ) : taskArmyStep === "submitted" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                      <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                      <p className="font-extrabold text-emerald-700">
                        Work Submitted!
                      </p>
                      <p className="mt-1 text-xs font-semibold text-emerald-600">
                        Tasker will review your submission shortly.
                      </p>
                      {taskArmySubmittedFiles.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 text-left text-xs font-extrabold uppercase tracking-wide text-[#786fa0]">
                            Your submitted files
                          </p>
                          <FileList
                            files={taskArmySubmittedFiles}
                            emptyText=""
                            showDelete={false}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <DropZone
                        dragging={dragging}
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                        onDragOver={(e: React.DragEvent) => {
                          e.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => taskArmyFileInputRef.current?.click()}
                        label="Upload your completed work"
                      />
                      <input
                        ref={taskArmyFileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.docx,.zip,.csv,.txt"
                        onChange={(e) => {
                          if (e.target.files)
                            uploadFiles(e.target.files, false);
                        }}
                      />

                      {taskArmySubmittedFiles.length > 0 && !uploading && (
                        <>
                          <FileList
                            files={taskArmySubmittedFiles}
                            emptyText=""
                            onDelete={deleteFile}
                            showDelete
                          />
                          <button
                            type="button"
                            className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] transition active:opacity-80 disabled:opacity-50"
                            onClick={handleSubmitWork}
                            disabled={submitting}
                          >
                            {submitting
                              ? "Submitting..."
                              : "✅ Submit Work to Tasker"}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </Section>
              </>
            )}

            {/* Activity log */}
            <Section
              title="📋 Activity Log"
              subtitle="Upload history for this task"
            >
              <div className="space-y-2">
                {[...taskerBriefFiles, ...taskArmySubmittedFiles].length ===
                0 ? (
                  <p className="py-4 text-center text-xs font-semibold text-[#786fa0]">
                    No activity yet
                  </p>
                ) : (
                  [...taskerBriefFiles, ...taskArmySubmittedFiles]
                    .sort(
                      (a, b) =>
                        new Date(b.uploadedAt).getTime() -
                        new Date(a.uploadedAt).getTime(),
                    )
                    .map((f) => (
                      <div key={f.id} className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#4f22bd]" />
                        <p className="break-words text-xs font-semibold text-[#374151]">
                          <span className="font-extrabold">
                            {f.uploadedBy === "tasker" ? "Tasker" : "TaskArmy"}
                          </span>{" "}
                          uploaded{" "}
                          <span className="break-all font-extrabold">
                            {f.name}
                          </span>
                          {" · "}
                          <span className="whitespace-nowrap text-[#9CA3AF]">
                            {f.uploadedAt}
                          </span>
                        </p>
                      </div>
                    ))
                )}
              </div>
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, subtitle, children, highlight, locked }: any) {
  return (
    <div
      className={`rounded-2xl border bg-white p-3 shadow-sm sm:p-4 ${
        highlight
          ? "border-[#4f22bd]/40 shadow-[0_0_0_2px_rgba(79,34,189,0.12)]"
          : locked
            ? "border-[#ded7ee] opacity-60"
            : "border-[#ded7ee]"
      }`}
    >
      <div className="mb-3">
        <p className="text-[15px] font-extrabold text-[#21145f] sm:text-base">
          {title}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[#786fa0]">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

function DropZone({
  dragging,
  uploading,
  uploadProgress,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  label = "Drag & drop files here",
}: any) {
  return (
    <>
      <div
        className={`mb-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-6 transition-all sm:py-7 ${
          dragging
            ? "border-[#4f22bd] bg-[#4f22bd]/5"
            : "border-[#ded7ee] bg-[#f8f6ff] hover:border-[#4f22bd]/50"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
      >
        <CloudUpload
          className={`mb-2 h-8 w-8 sm:h-9 sm:w-9 ${dragging ? "text-[#4f22bd]" : "text-[#ded7ee]"}`}
        />
        <p className="text-center text-sm font-extrabold text-[#21145f]">
          {dragging ? "Drop files here!" : label}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#786fa0]">
          or tap to browse
        </p>
      </div>
      {uploading && (
        <div className="mb-3">
          <div className="h-2 overflow-hidden rounded-full bg-[#ded7ee]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4f22bd] to-[#8B5CF6] transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs font-bold text-[#786fa0]">
            <Loader2 className="h-3 w-3 animate-spin" /> Uploading…{" "}
            {uploadProgress}%
          </p>
        </div>
      )}
    </>
  );
}

function FileList({ files, emptyText, onDelete, showDelete }: any) {
  if (files.length === 0)
    return emptyText ? (
      <p className="py-3 text-center text-xs font-semibold text-[#9CA3AF]">
        {emptyText}
      </p>
    ) : null;
  return (
    <div className="space-y-2">
      {files.map((f: TaskFile) => {
        const ext = f.type;
        const color = extColor(ext);
        return (
          <div
            key={f.id}
            className="flex items-center gap-2 rounded-xl border border-[#f0ecfa] bg-[#faf9ff] px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5"
          >
            <span className="shrink-0 text-xl sm:text-2xl">
              {fileIcon(ext)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-extrabold text-[#21145f] sm:text-sm">
                {f.name}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] font-semibold text-[#9CA3AF] sm:text-[11px]">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-extrabold"
                  style={{ background: color + "22", color }}
                >
                  {ext.toUpperCase()}
                </span>
                {f.size && <span className="shrink-0">{f.size}</span>}
                <span className="truncate">{f.uploadedAt}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <a
                href={f.url}
                download={f.name}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f22bd]/10 text-[#4f22bd] transition active:bg-[#4f22bd]/30 sm:h-8 sm:w-8"
              >
                <Download className="h-4 w-4" />
              </a>
              {showDelete && onDelete && (
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-400 transition active:bg-red-100 sm:h-8 sm:w-8"
                  onClick={() => onDelete(f.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: TaskArmyStep }) {
  const steps = [
    { key: "download" as const, label: "Download Brief" },
    { key: "upload" as const, label: "Upload Work" },
    { key: "submitted" as const, label: "Submitted" },
  ];
  const idx = steps.findIndex((s) => s.key === currentStep);
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#ded7ee] bg-white px-3 py-3 shadow-sm sm:px-4">
      {steps.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-all ${
                i < idx
                  ? "bg-emerald-500 text-white"
                  : i === idx
                    ? "bg-[#4f22bd] text-white shadow-[0_0_0_3px_rgba(79,34,189,0.2)]"
                    : "bg-[#f0ecfa] text-[#786fa0]"
              }`}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <p
              className={`mt-1 text-[10px] font-extrabold leading-tight ${
                i === idx ? "text-[#4f22bd]" : "text-[#786fa0]"
              }`}
            >
              {step.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-1.5 h-0.5 flex-1 rounded-full transition-all sm:mx-2 ${
                i < idx ? "bg-emerald-400" : "bg-[#ded7ee]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyWaiting({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-5 text-center">
      <FolderOpen className="mb-2 h-10 w-10 text-[#ded7ee]" />
      <p className="text-xs font-semibold text-[#9CA3AF]">{text}</p>
    </div>
  );
}

function LockedMessage({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-5 text-center">
      <span className="mb-2 text-3xl">🔒</span>
      <p className="text-xs font-semibold text-[#9CA3AF]">{text}</p>
    </div>
  );
}
