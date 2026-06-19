import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { filesApi, type ApiFile } from "@/lib/api/files";
import { fetchTaskWithFallback, uploadFilesSequentially } from "@/lib/task-files";
import { readBaseUrl } from "@/lib/session-store";
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

export function useTaskFiles(
  taskId: string,
  session: Session | undefined,
  fallbackFiles: ApiFile[],
  enabled: boolean,
) {
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
      const data = response.data ?? [];
      return data.length > 0 ? data : fallbackFiles;
    },
    enabled: Boolean(session?.token) && Boolean(taskId) && enabled,
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
    mutationFn: (fileId: string) => {
      if (!session) throw new Error("Please log in to delete this file.");
      return filesApi.remove(readBaseUrl(), session.token, fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
    },
  });
}

export function useSubmitTaskWork(taskId: string, session: Session | undefined) {
  return useMutation({
    mutationFn: () => {
      if (!session) throw new Error("Please log in to submit work.");
      return tasksApi.submitWork(readBaseUrl(), session.token, taskId);
    },
  });
}

export function useApproveTaskWork(taskId: string, session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!session) throw new Error("Please log in to approve work.");
      return tasksApi.approveWork(readBaseUrl(), session.token, Number(taskId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-details", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
    },
  });
}

export function useRequestTaskRevision(taskId: string, session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => {
      if (!session) throw new Error("Please log in to request a revision.");
      return tasksApi.requestRevision(readBaseUrl(), session.token, Number(taskId), {
        note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-details", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
    },
  });
}
