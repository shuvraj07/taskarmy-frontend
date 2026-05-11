import type {
  ApiEnvelope,
  Bid,
  BidCreatePayload,
  Credentials,
  LoginResponse,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  UserRegistration
} from "@/lib/types";

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
      error: message
    };
  }

  return {
    ok: true,
    status: response.status,
    data: data as T
  };
}

async function request<T>(
  baseUrl: string,
  path: string,
  method: string,
  options: RequestOptions = {}
): Promise<ApiEnvelope<T>> {
  try {
    const headers: HeadersInit = {};

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    return parseResponse<T>(response);
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Network request failed"
    };
  }
}

export const taskArmyApi = {
  root: (baseUrl: string) => request<unknown>(baseUrl, "/", "GET"),
  health: (baseUrl: string) => request<unknown>(baseUrl, "/health", "GET"),
  register: (baseUrl: string, body: UserRegistration) =>
    request<unknown>(baseUrl, "/auth/register", "POST", { body }),
  login: (baseUrl: string, body: Credentials) =>
    request<LoginResponse>(baseUrl, "/auth/login", "POST", { body }),
  createTask: (baseUrl: string, token: string, body: TaskCreatePayload) =>
    request<Task>(baseUrl, "/tasks/", "POST", { token, body }),
  myTasks: (baseUrl: string, token: string) =>
    request<Task[]>(baseUrl, "/tasks/my", "GET", { token }),
  updateTask: (baseUrl: string, token: string, taskId: number, body: TaskUpdatePayload) =>
    request<Task>(baseUrl, `/tasks/${taskId}`, "PUT", { token, body }),
  acceptBid: (baseUrl: string, token: string, taskId: number, bidId: number) =>
    request<Task>(baseUrl, `/tasks/${taskId}/accept-bid/${bidId}`, "PUT", { token }),
  rejectBid: (baseUrl: string, token: string, taskId: number, bidId: number) =>
    request<Task>(baseUrl, `/tasks/${taskId}/reject-bid/${bidId}`, "PUT", { token }),
  deleteTask: (baseUrl: string, token: string, taskId: number) =>
    request<unknown>(baseUrl, `/tasks/${taskId}`, "DELETE", { token }),
  browseTasks: (baseUrl: string, token: string) =>
    request<Task[]>(baseUrl, "/tasks/", "GET", { token }),
  placeBid: (baseUrl: string, token: string, taskId: number, body: BidCreatePayload) =>
    request<Bid>(baseUrl, `/tasks/${taskId}/bid`, "POST", { token, body }),
  myBids: (baseUrl: string, token: string) =>
    request<Bid[]>(baseUrl, "/tasks/my-bids", "GET", { token })
};
