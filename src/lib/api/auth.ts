import type { Credentials, LoginResponse, Role, UserRegistration } from "@/lib/types";
import { loginResponseSchema } from "@/lib/schemas";
import { mapFrontendRoleToBackend } from "@/lib/session-store";
import { request, validateResponse } from "@/lib/api/client";

export const authApi = {
  register: async (baseUrl: string, body: UserRegistration) =>
    request<unknown>(baseUrl, "/auth/register", "POST", {
      body: { ...body, role: mapFrontendRoleToBackend(body.role) },
    }),

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

  updateProfile: async (baseUrl: string, token: string, body: { role: Role }) => {
    return request<{ role: string }>(baseUrl, "/auth/profile", "PATCH", {
      token,
      body: { role: mapFrontendRoleToBackend(body.role) },
    });
  },
};
