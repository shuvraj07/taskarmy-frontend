import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { readBaseUrl } from "@/features/auth";
import type { Session, TaskCreatePayload, TaskUpdatePayload } from "@/lib/types";

export function useMyTasks(session: Session | undefined) {
  return useQuery({
    queryKey: ["tasks", "my", session?.token ?? null],
    queryFn: () => tasksApi.myTasks(readBaseUrl(), session!.token),
    enabled: Boolean(session),
  });
}

export function useBrowseTasks(session: Session | undefined) {
  return useQuery({
    queryKey: ["tasks", "browse", session?.token ?? null],
    queryFn: () => tasksApi.browseTasks(readBaseUrl(), session!.token),
    enabled: Boolean(session),
    refetchInterval: 15_000,
  });
}

export function useCreateTask(session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskCreatePayload) => {
      if (!session) throw new Error("Login as a client to create a task.");
      return tasksApi.createTask(readBaseUrl(), session.token, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask(session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: number;
      payload: TaskUpdatePayload;
    }) => {
      if (!session) throw new Error("Login as a client to update a task.");
      return tasksApi.updateTask(readBaseUrl(), session.token, taskId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask(session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => {
      if (!session) throw new Error("Login as a client to delete a task.");
      return tasksApi.deleteTask(readBaseUrl(), session.token, taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
