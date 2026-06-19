import type { ApiEnvelope } from "@/lib/types";

const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

export type RequestOptions = {
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

export function validateResponse<T>(
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

export async function request<T>(
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

export async function requestFormData<T>(
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

export const taskzityApi = {
  root: (baseUrl: string) => request<unknown>(baseUrl, "/", "GET"),
  health: (baseUrl: string) => request<unknown>(baseUrl, "/health", "GET"),
};
