"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  ActivityLog,
  ClientFileExchange,
  derivePassiveFileExchangeError,
  ErrorBanner,
  FileExchangeHeader,
  getTaskOwnerId,
  splitTaskFiles,
  StatusBanner,
  SUBMITTED_STATUSES,
  TaskerFileExchange,
  TaskNotFound,
  useApproveTaskWork,
  useDeleteTaskFile,
  useRequestTaskRevision,
  useSubmitTaskWork,
  useTaskDetails,
  useTaskFiles,
  useTaskerStepMachine,
  useUploadTaskFiles,
} from "@/features/task-files";
import type { Role } from "@/lib/types";

export default function TaskFilesPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId as string;

  const { activeSession, activeRole, isHydrated } = useAuth();
  const role: Role = activeRole === "tasker" ? "tasker" : "client";
  const notLoggedIn = isHydrated && !activeSession?.token;

  const taskQuery = useTaskDetails(taskId, role, activeSession);
  const taskDetails = taskQuery.data ?? null;
  const taskOwnerId = taskDetails ? getTaskOwnerId(taskDetails) : null;

  const filesQuery = useTaskFiles(taskId, activeSession);
  // The dedicated files endpoint is the source of truth; the task's own
  // embedded `files` field (if any) is only a fallback for when that
  // endpoint comes back empty. Computed here, reactively, so it's correct
  // regardless of which of the two parallel queries finishes first.
  const effectiveFiles = useMemo(
    () =>
      filesQuery.data && filesQuery.data.length > 0
        ? filesQuery.data
        : taskDetails?.files ?? [],
    [filesQuery.data, taskDetails],
  );
  const { briefs: clientBriefFiles, deliverables: taskerSubmittedFiles } = useMemo(
    () => splitTaskFiles(effectiveFiles, taskOwnerId),
    [effectiveFiles, taskOwnerId],
  );

  const { uploading, uploadProgress, uploadFiles } = useUploadTaskFiles(
    taskId,
    activeSession,
  );
  const deleteMutation = useDeleteTaskFile(taskId, activeSession);
  const submitMutation = useSubmitTaskWork(taskId, activeSession);
  const approveMutation = useApproveTaskWork(taskId, activeSession);
  const revisionMutation = useRequestTaskRevision(taskId, activeSession);

  const taskerStepMachine = useTaskerStepMachine(taskId);
  const { hydrateFromServer } = taskerStepMachine;

  // Restore the Tasker's step from the server once both queries have
  // resolved. The reducer ignores every call after the first one, so this
  // can safely re-run on every refetch without re-deriving anything.
  useEffect(() => {
    if (role !== "tasker") return;
    if (!taskQuery.isSuccess || !filesQuery.isSuccess || !taskDetails) return;

    hydrateFromServer({
      alreadySubmitted: SUBMITTED_STATUSES.includes(taskDetails.status ?? ""),
      hasBrief: clientBriefFiles.length > 0,
      hasDeliverables: taskerSubmittedFiles.length > 0,
    });
  }, [
    role,
    taskQuery.isSuccess,
    filesQuery.isSuccess,
    taskDetails,
    clientBriefFiles.length,
    taskerSubmittedFiles.length,
    hydrateFromServer,
  ]);

  // Errors that describe real, ongoing state — always in sync with the
  // underlying query/auth state, never go stale, and aren't dismissible
  // because dismissing them wouldn't change anything true about the world.
  const passiveError = derivePassiveFileExchangeError({
    notLoggedIn,
    taskNotFound: taskQuery.isSuccess && !taskDetails,
    taskId,
    filesErrorMessage: filesQuery.isError
      ? filesQuery.error instanceof Error
        ? filesQuery.error.message
        : "Failed to load files"
      : null,
  });

  // Errors from one-off user actions (upload/delete/submit/review) — these
  // ARE dismissible, and always take priority over a passive error.
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const errorMsg = actionError ?? passiveError;

  async function handleUpload(selectedFiles: FileList | null) {
    if (!selectedFiles) return;
    setActionError(null);
    const result = await uploadFiles(selectedFiles);
    if (!result.ok) {
      setActionError(result.error ?? "Upload failed");
      return;
    }
    // After a Tasker upload, always make sure we're on the upload step so
    // the Submit button is visible. Step only leaves "upload" when the user
    // explicitly clicks Submit (which calls the API and sets "submitted").
    if (role === "tasker") {
      taskerStepMachine.markFilesUploaded();
    }
  }

  async function handleDeleteFile(id: string) {
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleSubmitWork() {
    if (taskerSubmittedFiles.length === 0) {
      setActionError("Please upload your completed work before submitting.");
      return;
    }
    setActionError(null);
    setStatusMsg(null);
    try {
      const response = await submitMutation.mutateAsync();
      if (!response.ok) throw new Error(response.error ?? "Submit failed");
      taskerStepMachine.markWorkSubmitted();
      setStatusMsg("Work submitted to the Client for review.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Submit failed");
    }
  }

  async function handleApproveWork() {
    if (taskerSubmittedFiles.length === 0) {
      setActionError("No submitted files are available to approve.");
      return;
    }
    setActionError(null);
    setStatusMsg(null);
    try {
      const response = await approveMutation.mutateAsync();
      if (!response.ok)
        throw new Error(response.error ?? "Failed to approve work.");
      setStatusMsg("Work approved. Task is now marked complete.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to approve work.",
      );
    }
  }

  async function handleRequestRevision(comment: string): Promise<boolean> {
    if (!comment.trim()) {
      setActionError("Please add a revision comment before requesting changes.");
      return false;
    }
    if (taskerSubmittedFiles.length === 0) {
      setActionError("No submitted files are available to request revision for.");
      return false;
    }
    setActionError(null);
    setStatusMsg(null);
    try {
      const response = await revisionMutation.mutateAsync(comment.trim());
      if (!response.ok)
        throw new Error(response.error ?? "Failed to request revision.");
      setStatusMsg("Revision requested. Tasker will receive your comment.");
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to request revision.",
      );
      return false;
    }
  }

  function handleRefresh() {
    void taskQuery.refetch();
    void filesQuery.refetch();
  }

  const isLoadingPage =
    !isHydrated ||
    (Boolean(activeSession?.token) &&
      (taskQuery.isLoading || filesQuery.isLoading));
  const reviewBusy = approveMutation.isPending || revisionMutation.isPending;

  return (
    <div className="min-h-screen w-full bg-[#f8f6ff]">
      <FileExchangeHeader
        taskId={taskId}
        taskTitle={taskDetails?.title}
        role={role}
        onBack={() => router.back()}
        onRefresh={handleRefresh}
      />

      <main
        className="space-y-4 px-3 pb-8 pt-4 sm:px-4"
        style={{
          paddingBottom:
            "max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))",
        }}
      >
        {errorMsg && (
          <ErrorBanner
            message={errorMsg}
            onDismiss={actionError ? () => setActionError(null) : undefined}
          />
        )}
        {statusMsg && <StatusBanner message={statusMsg} />}

        {isLoadingPage ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#4f22bd]" />
          </div>
        ) : !taskDetails ? (
          <TaskNotFound taskId={taskId} onBack={() => router.push("/")} />
        ) : (
          <>
            {role === "client" && (
              <ClientFileExchange
                briefFiles={clientBriefFiles}
                submittedFiles={taskerSubmittedFiles}
                uploading={uploading}
                uploadProgress={uploadProgress}
                reviewBusy={reviewBusy}
                onUploadBrief={handleUpload}
                onDeleteFile={handleDeleteFile}
                onApprove={handleApproveWork}
                onRequestRevision={handleRequestRevision}
              />
            )}

            {role === "tasker" && (
              <TaskerFileExchange
                step={taskerStepMachine.step}
                briefFiles={clientBriefFiles}
                submittedFiles={taskerSubmittedFiles}
                hasUploadedWork={taskerStepMachine.hasUploadedWork}
                uploading={uploading}
                uploadProgress={uploadProgress}
                submitting={submitMutation.isPending}
                onConfirmDownload={taskerStepMachine.confirmDownload}
                onUploadWork={handleUpload}
                onDeleteFile={handleDeleteFile}
                onSubmit={handleSubmitWork}
                onRefresh={handleRefresh}
              />
            )}

            <ActivityLog files={[...clientBriefFiles, ...taskerSubmittedFiles]} />
          </>
        )}
      </main>
    </div>
  );
}
