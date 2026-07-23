import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { filesApi } from "../api/files";
import { fetchTaskWithFallback, uploadFilesSequentially } from "../services/task-files";
import { readBaseUrl } from "@/lib/session-store";
import { useWalletStore } from "@/lib/payment/wallet-store";
import type { Role, Session } from "@/lib/types";

export function useTaskDetails(
  taskId: string,
  role: Role,
  session: Session | undefined,
) {
  return useQuery({
    queryKey: ["task-details", taskId, role, session?.token ?? null],
    queryFn: () =>
      fetchTaskWithFallback(readBaseUrl(), session!.token, taskId, role),
    enabled: Boolean(session?.token) && Boolean(taskId),
  });
}

export function useTaskFiles(taskId: string, session: Session | undefined) {
  return useQuery({
    queryKey: ["task-files", taskId, session?.token ?? null],
    queryFn: async () => {
      const response = await filesApi.listForTask(
        readBaseUrl(),
        session!.token,
        taskId,
      );
      if (!response.ok) {
        throw new Error(response.error ?? `Failed to load files (${response.status})`);
      }
      return response.data ?? [];
    },
    // Runs in parallel with useTaskDetails — it only needs taskId/session,
    // not the task's own payload, so there's no reason to wait on that
    // query first (that used to add a full extra network round trip).
    enabled: Boolean(session?.token) && Boolean(taskId),
  });
}

export function useUploadTaskFiles(taskId: string, session: Session | undefined) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFiles = useCallback(
    async (selectedFiles: FileList) => {
      if (!session) return { ok: false, error: "Please log in to upload files." };
      if (!selectedFiles || selectedFiles.length === 0) return { ok: true };

      setUploading(true);
      setUploadProgress(0);
      const baseUrl = readBaseUrl();
      const fileArray = Array.from(selectedFiles);

      const result = await uploadFilesSequentially(
        fileArray,
        async (file) => {
          // Real upload progress isn't available from fetch here, so fake a
          // trickle up to 90% while waiting, then jump to the real
          // checkpoint once the file actually finishes (see onProgress).
          const progressInterval = setInterval(() => {
            setUploadProgress((p) => Math.min(p + 5, 90));
          }, 100);
          const response = await filesApi.upload(baseUrl, session.token, taskId, file);
          clearInterval(progressInterval);
          return response;
        },
        setUploadProgress,
      );

      setUploading(false);
      setUploadProgress(0);
      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
      }
      return result;
    },
    [session, taskId, queryClient],
  );

  return { uploading, uploadProgress, uploadFiles };
}

export function useDeleteTaskFile(taskId: string, session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      if (!session) throw new Error("Please log in to delete this file.");
      const response = await filesApi.remove(readBaseUrl(), session.token, fileId);
      if (!response.ok) throw new Error(response.error ?? "Failed to delete file");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
    },
  });
}

export function useSubmitTaskWork(taskId: string, session: Session | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Please log in to submit work.");
      const response = await tasksApi.submitWork(readBaseUrl(), session.token, taskId);
      if (!response.ok) throw new Error(response.error ?? "Failed to submit work");
      return response;
    },
  });
}

export function useApproveTaskWork(taskId: string, session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Please log in to approve work.");
      const response = await tasksApi.approveWork(readBaseUrl(), session.token, Number(taskId));
      if (!response.ok) throw new Error(response.error ?? "Failed to approve work");
      return response;
    },
    onSuccess: () => {
      useWalletStore.getState().releaseEscrow(Number(taskId));
      queryClient.invalidateQueries({ queryKey: ["task-details", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
    },
  });
}

export function useRequestTaskRevision(taskId: string, session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: string) => {
      if (!session) throw new Error("Please log in to request a revision.");
      const response = await tasksApi.requestRevision(readBaseUrl(), session.token, Number(taskId), { note });
      if (!response.ok) throw new Error(response.error ?? "Failed to request revision");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-details", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
    },
  });
}
