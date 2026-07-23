import { request, requestFormData } from "@/lib/api/client";
import type { ApiEnvelope } from "@/lib/types";

export type ApiFile = {
  id: number;
  task_id: number | null;
  uploader_id: number;
  uploader_role?: string;
  file_url: string;
  file_name: string;
  file_type: string;
  created_at: string;
};

export const filesApi = {
  listForTask: async (
    baseUrl: string,
    token: string,
    taskId: string | number,
  ): Promise<ApiEnvelope<ApiFile[]>> => {
    const response = await request<ApiFile[]>(
      baseUrl,
      `/files/task/${taskId}`,
      "GET",
      { token },
    );
    // No files uploaded yet — treat as an empty list, not an error.
    if (!response.ok && response.status === 404) {
      return { ok: true, status: 404, data: [] };
    }
    return response;
  },

  upload: (
    baseUrl: string,
    token: string,
    taskId: string | number,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData<unknown>(
      baseUrl,
      `/files/upload?task_id=${taskId}`,
      token,
      formData,
    );
  },

  remove: (baseUrl: string, token: string, fileId: string) =>
    request<unknown>(baseUrl, `/files/${fileId}`, "DELETE", { token }),
};
