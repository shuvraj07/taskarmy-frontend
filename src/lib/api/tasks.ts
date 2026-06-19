import type { Task, TaskCreatePayload, TaskUpdatePayload } from "@/lib/types";
import { taskArraySchema, taskSchema } from "@/lib/schemas";
import { request, validateResponse } from "@/lib/api/client";

export const tasksApi = {
  createTask: async (baseUrl: string, token: string, body: TaskCreatePayload) => {
    const response = await request<Task>(baseUrl, "/tasks/", "POST", {
      token,
      body,
    });
    return validateResponse(response, taskSchema);
  },

  myTasks: async (baseUrl: string, token: string) => {
    const response = await request<Task[]>(baseUrl, "/tasks/my", "GET", {
      token,
    });
    return validateResponse(response, taskArraySchema);
  },

  updateTask: async (
    baseUrl: string,
    token: string,
    taskId: number,
    body: TaskUpdatePayload,
  ) => {
    const response = await request<Task>(baseUrl, `/tasks/${taskId}`, "PUT", {
      token,
      body,
    });
    return validateResponse(response, taskSchema);
  },

  deleteTask: (baseUrl: string, token: string, taskId: number) =>
    request<unknown>(baseUrl, `/tasks/${taskId}`, "DELETE", { token }),

  browseTasks: async (baseUrl: string, token: string) => {
    const response = await request<Task[]>(baseUrl, "/tasks/", "GET", {
      token,
    });
    return validateResponse(response, taskArraySchema);
  },

  // Unlike approveWork/requestRevision below, this deliberately isn't
  // validated against taskSchema: the backend's /submit response shape
  // hasn't been confirmed to be a full Task, so we only check that the
  // request succeeded and let the caller treat the body as opaque.
  submitWork: (baseUrl: string, token: string, taskId: string | number) =>
    request<unknown>(baseUrl, `/tasks/${taskId}/submit`, "POST", {
      token,
      body: { task_id: Number(taskId) },
    }),

  approveWork: async (baseUrl: string, token: string, taskId: number) => {
    const response = await request<Task>(
      baseUrl,
      `/tasks/${taskId}/approve`,
      "POST",
      { token },
    );
    return validateResponse(response, taskSchema);
  },

  requestRevision: async (
    baseUrl: string,
    token: string,
    taskId: number,
    body: { note: string },
  ) => {
    const response = await request<Task>(
      baseUrl,
      `/tasks/${taskId}/revision`,
      "POST",
      { token, body },
    );
    return validateResponse(response, taskSchema);
  },

  getSubmission: async (baseUrl: string, token: string, taskId: number) => {
    return request<{ file_url: string; message?: string }>(
      baseUrl,
      `/tasks/${taskId}/submission`,
      "GET",
      { token },
    );
  },
};
