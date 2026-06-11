import type {
  ApiEnvelope,
  Bid,
  BidCreatePayload,
  Credentials,
  LoginResponse,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  UserRegistration,
} from "@/lib/types";
import {
  bidArraySchema,
  bidSchema,
  loginResponseSchema,
  taskArraySchema,
  taskSchema,
} from "@/lib/schemas";

const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

type RequestOptions = {
  token?: string;
  body?: unknown;
};

export function getDefaultBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : typeof data === "string" && data.length > 0
          ? data
          : `Request failed with ${response.status}`;

    return {
      ok: false,
      status: response.status,
      data: null,
      error: message,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: data as T,
  };
}

function validateResponse<T>(
  envelope: ApiEnvelope<unknown>,
  schema: {
    safeParse(
      value: unknown,
    ):
      | { success: true; data: T }
      | { success: false; error: { message: string } };
  },
): ApiEnvelope<T> {
  if (!envelope.ok || envelope.data === null) {
    return envelope as ApiEnvelope<T>;
  }

  const parsed = schema.safeParse(envelope.data);
  if (!parsed.success) {
    return {
      ok: false,
      status: envelope.status,
      data: null,
      error: parsed.error.message,
    };
  }

  return {
    ok: true,
    status: envelope.status,
    data: parsed.data,
  };
}

async function request<T>(
  baseUrl: string,
  path: string,
  method: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const headers: HeadersInit = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    return await parseResponse<T>(response);
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Network request failed",
    };
  }
}

async function requestFormData<T>(
  baseUrl: string,
  path: string,
  token: string,
  formData: FormData,
): Promise<ApiEnvelope<T>> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return await parseResponse<T>(response);
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Network request failed",
    };
  }
}

export const taskArmyApi = {
  root: (baseUrl: string) => request<unknown>(baseUrl, "/", "GET"),

  health: (baseUrl: string) => request<unknown>(baseUrl, "/health", "GET"),

  register: async (baseUrl: string, body: UserRegistration) =>
    request<unknown>(baseUrl, "/auth/register", "POST", { body }),

  login: async (baseUrl: string, body: Credentials) => {
    const response = await request<LoginResponse>(
      baseUrl,
      "/auth/login",
      "POST",
      { body },
    );
    return validateResponse(response, loginResponseSchema);
  },

  googleLogin: async (
    baseUrl: string,
    body: { token: string; role?: string },
  ) => {
    const response = await request<LoginResponse & { role?: string }>(
      baseUrl,
      "/auth/google/token",
      "POST",
      { body },
    );
    return validateResponse(response, loginResponseSchema);
  },

  updateProfile: async (
    baseUrl: string,
    token: string,
    body: { role: string },
  ) => {
    return request<{ role: string }>(baseUrl, "/auth/profile", "PATCH", {
      token,
      body,
    });
  },

  // ── Tasks
  createTask: async (
    baseUrl: string,
    token: string,
    body: TaskCreatePayload,
  ) => {
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

  acceptBid: async (
    baseUrl: string,
    token: string,
    taskId: number,
    bidId: number,
  ) => {
    const response = await request<Task>(
      baseUrl,
      `/tasks/${taskId}/accept-bid/${bidId}`,
      "PUT",
      { token },
    );
    return validateResponse(response, taskSchema);
  },

  rejectBid: async (
    baseUrl: string,
    token: string,
    taskId: number,
    bidId: number,
  ) => {
    const response = await request<Task>(
      baseUrl,
      `/tasks/${taskId}/reject-bid/${bidId}`,
      "PUT",
      { token },
    );
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

  placeBid: async (
    baseUrl: string,
    token: string,
    taskId: number,
    body: BidCreatePayload,
  ) => {
    const response = await request<Bid>(
      baseUrl,
      `/tasks/${taskId}/bid`,
      "POST",
      { token, body },
    );
    return validateResponse(response, bidSchema);
  },

  myBids: async (baseUrl: string, token: string) => {
    const response = await request<Bid[]>(baseUrl, "/tasks/my-bids", "GET", {
      token,
    });
    return validateResponse(response, bidArraySchema);
  },

  // ✅ FIXED — plain POST, no file/formData
  submitWork: async (baseUrl: string, token: string, taskId: number) => {
    const response = await request<Task>(
      baseUrl,
      `/tasks/${taskId}/submit`,
      "POST",
      { token },
    );
    return validateResponse(response, taskSchema);
  },

  // ✅ FIXED — PUT → POST
  approveWork: async (baseUrl: string, token: string, taskId: number) => {
    const response = await request<Task>(
      baseUrl,
      `/tasks/${taskId}/approve`,
      "POST",
      { token },
    );
    return validateResponse(response, taskSchema);
  },

  // ✅ FIXED — PUT → POST, message → note
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

  // ── Get submitted file download URL
  getSubmission: async (baseUrl: string, token: string, taskId: number) => {
    return request<{ file_url: string; message?: string }>(
      baseUrl,
      `/tasks/${taskId}/submission`,
      "GET",
      { token },
    );
  },
};
